/* Task tray button.
 * Displays a button on the task tray.
 *
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The R&D leading to these results received funding from the
 * Department of Education - Grant H421A150005 (GPII-APCP). However,
 * these results do not necessarily represent the policy of the
 * Department of Education, and you should not assume endorsement by the
 * Federal Government.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */


#define UNICODE 1
#define _UNICODE 1
#include <Windows.h>
#include <uxtheme.h>
#include <stdio.h>
#include <WinBase.h>
#include <shlwapi.h>

#pragma comment (lib, "User32.lib")
#pragma comment (lib, "Kernel32.lib")
#pragma comment (lib, "gdi32.lib")
#pragma comment (lib, "uxtheme.lib")
#pragma comment (lib, "Msimg32.lib")
#pragma comment (lib, "Shlwapi.lib")

#define BUTTON_CLASS L"GPII-TrayButton"
#define GPII_CLASS L"gpii-message-window"
#define BUTTON_MESSAGE L"GPII-TrayButton-Message"
#define BUTTON_POSITION_MESSAGE L"GPII-TrayButtonPos-Message"

// Commands sent from GPII
#define GPII_COMMAND_ICON    1
#define GPII_COMMAND_ICON_HC 2
#define GPII_COMMAND_TOOLTIP  3
#define GPII_COMMAND_DESTROY  4
#define GPII_COMMAND_STATE    5

// Notifications sent to GPII
#define GPII_MSG_UPDATE     0
#define GPII_MSG_CLICK      1
#define GPII_MSG_SHOWMENU   2
#define GPII_MSG_MOUSEENTER 3
#define GPII_MSG_MOUSELEAVE 4

#define true TRUE
#define false FALSE
#define null NULL

#define ICON_SIZE 16
#define BUTTON_WIDTH 24

// Button states
#define STATE_NORMAL  1
#define STATE_HOVER   2
#define STATE_PRESSED 4
#define STATE_CHECKED 8

/** Current state of the button */
int buttonState = STATE_NORMAL;
/** last known window sizes */
RECT taskRect = { 0 }, notifyRect = { 0 }, trayClient = { 0 }, windowRect = { 0 };

HWND buttonWindow = null;
HWND tooltipWindow = null;

BOOL highContrast = false;
UINT currentDpi = 0;
int iconSize = ICON_SIZE;

/** The icon of the button */
HICON hIcon = null;
WCHAR *iconFile = null;
/** The icon used for high-contrast */
WCHAR *iconFileHC = null;

/** WM_SHELLHOOKMESSAGE */
UINT shellMessage = 0;
UINT gpiiMessage = 0;
UINT gpiiPositionMessage = 0;
HANDLE gpiiWindow = null;

/** true if the button destruction is intentional */
BOOL die = false;

#define log(FMT, ...) {wprintf(L ## FMT L"\n", __VA_ARGS__); fflush(stdout);}
#define fail(FMT, ...) {wprintf(L"fail: " L ## FMT, __VA_ARGS__); wprintf(L"(win32:%u)\n", GetLastError()); fflush(stdout);}
#ifdef _DEBUG
# define debug(FMT, ...) log(FMT, __VA_ARGS__)
#else
# define debug(FMT, ...)
#endif

/**
 * Convert the value based on 96dpi to the current dpi.
 */
#define fixDpi(size) MulDiv(size, currentDpi, 96)

/**
 * Cause the button to be redrawn.
 */
void redraw()
{
	RedrawWindow(buttonWindow, null, null, RDW_ERASE | RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
}

/**
 * Get the taskbar window handle.
 * @return The taskbar's window handle.
 */
HWND getTaskbarWindow()
{
	return FindWindow(L"Shell_TrayWnd", null);
}

#define TIMER_RESIZE 1
#define TIMER_CHECK 2
#define TIMER_CHECK_DELAY 5000

void setImage(WCHAR *file);

/**
 * Hide the button
 */
void hideButton()
{
	if (!IsWindow(gpiiWindow)) {
		gpiiWindow = null;
	}

	iconFile = null;
	if (hIcon) {
		DestroyIcon(hIcon);
		hIcon = null;
	}

	if (IsWindow(buttonWindow)) {
		ShowWindow(buttonWindow, SW_HIDE);
	}

	HANDLE taskbar = getTaskbarWindow();
	if (taskbar) {
		// Make the taskbar adjust the sizes
		SendMessage(taskbar, WM_ENTERSIZEMOVE, 0, 0);
		SendMessage(taskbar, WM_EXITSIZEMOVE, 0, 0);
	}
}

UINT(WINAPI *my_GetDpiForWindow)(HWND) = null;
BOOL noGetDpiForWindow = false;
UINT getDpi(HWND window)
{
	UINT result = 0;

	if (!noGetDpiForWindow) {
		if (!my_GetDpiForWindow) {
			// Manually get the GetDpiForWindow function - it's only available on Windows 10.1607 and it's not
			// defined in the SDK that's currently used.
			HINSTANCE user32 = LoadLibrary(L"user32.dll");
			if (user32) {
				*(void**)&my_GetDpiForWindow = GetProcAddress(user32, "GetDpiForWindow");
			}
			noGetDpiForWindow = !my_GetDpiForWindow;
		}
		if (my_GetDpiForWindow) {
			result = my_GetDpiForWindow(window);
		}
	}

	if (!result) {
		result = currentDpi ? currentDpi : 96;
	}

	return result;
}

/**
 * Move the button in between the task list and notification icons by shrinking the task list.
 *
 * @param force true to always resize, even if not required.
 * @return true if resize was required.
 */
BOOL positionTrayWindows(BOOL force)
{
	debug("positionTrayWindows");

	if (!buttonWindow) {
		return false;
	}
	if (!IsWindow(gpiiWindow)) {
		hideButton();
	}
	if (!hIcon) {
		return false;
	}

	// Task bar
	HWND tray = getTaskbarWindow();
	// Container of the window list (and toolbars)
	HWND tasks = FindWindowEx(tray, null, L"ReBarWindow32", null);
	// The notification icons
	HWND notify = FindWindowEx(tray, null, L"TrayNotifyWnd", null);

	debug("tray:%u tasks:%u notify:%u", tray, tasks, notify);

	// Current DPI
	UINT dpi = getDpi(tray);
	if (dpi != currentDpi) {
		currentDpi = dpi;
		setImage(iconFile);
		return true;
	}

	// Get the dimensions of both windows.
	RECT newTaskRect, newNotifyRect, newTrayClient;
	RECT buttonRect = { 0 };
	GetWindowRect(tasks, &newTaskRect);
	GetWindowRect(notify, &newNotifyRect);
	GetClientRect(tray, &newTrayClient);
	// Have they changed since last time?
	BOOL changed = !EqualRect(&taskRect, &newTaskRect)
		|| !EqualRect(&notifyRect, &newNotifyRect)
		|| !EqualRect(&trayClient, &newTrayClient);

	CopyRect(&taskRect, &newTaskRect);
	CopyRect(&notifyRect, &newNotifyRect);
	CopyRect(&trayClient, &newTrayClient);

	// Check the orientation
	RECT trayRect;
	GetWindowRect(tray, &trayRect);
	BOOL vert = trayRect.top == 0 && trayRect.bottom > GetSystemMetrics(SM_CYFULLSCREEN) - 10;

	if (vert) {
		// Shrink the tasks window
		taskRect.bottom = notifyRect.top - fixDpi(BUTTON_WIDTH);
		// Put the button between
		buttonRect.top = taskRect.bottom;
		buttonRect.bottom = notifyRect.top;
		buttonRect.left = highContrast ? 1 : 0;
		buttonRect.right = trayClient.right;
	} else {
		// Check the reading direction - if the notification icons are left of the task list, then assume right-to-left.
		BOOL rtl = notifyRect.left < taskRect.left;

		if (rtl) {
			// notification area is on the left
			// Shrink the tasks window
			taskRect.left = notifyRect.right + fixDpi(BUTTON_WIDTH);
			// Put the button between
			buttonRect.left = trayClient.right - taskRect.left;
			buttonRect.right = trayClient.right - notifyRect.right;
		} else {
			// notification area is on the right (the common way)
			// Shrink the tasks window
			taskRect.right = notifyRect.left - fixDpi(BUTTON_WIDTH);
			// Put the button between
			buttonRect.left = taskRect.right;
			buttonRect.right = notifyRect.left;
		}

		buttonRect.top = highContrast ? 1 : 0;
		buttonRect.bottom = trayClient.bottom;
	}

	if (!force || !changed) {
		// See if the button needs to be moved
		RECT currentRect;
		GetWindowRect(buttonWindow, &currentRect);
		MapWindowPoints(HWND_DESKTOP, tray, (POINT*)&currentRect, 2);
		changed = changed || !EqualRect(&buttonRect, &currentRect);
	}

	if (force || changed) {
		// shrink the task list
		SetWindowPos(tasks, HWND_BOTTOM,
			0, 0,
			taskRect.right - taskRect.left,
			taskRect.bottom - taskRect.top,
			SWP_NOACTIVATE | SWP_NOMOVE);

		// Move the button between the tasks and notification area
		SetWindowPos(buttonWindow, HWND_TOP,
			buttonRect.left, buttonRect.top,
			buttonRect.right - buttonRect.left,
			buttonRect.bottom - buttonRect.top,
			SWP_NOACTIVATE | SWP_SHOWWINDOW);

		redraw();
	}

	if (force || changed) {
		SetTimer(buttonWindow, TIMER_RESIZE, 100, NULL);
		SetTimer(buttonWindow, TIMER_CHECK, 1000, null);
	} else {
		KillTimer(buttonWindow, TIMER_RESIZE);
	}

	if (changed) {
		// Inform gpii about the new position.
		RECT currentRect;
		GetWindowRect(buttonWindow, &currentRect);
		if (!EqualRect(&windowRect, &currentRect)) {
			windowRect = currentRect;
			sendToGpii(gpiiPositionMessage,
				MAKELONG(windowRect.left, windowRect.top),
				MAKELONG(windowRect.right - windowRect.left, windowRect.bottom - windowRect.top));
		}
	}

	return changed;
}

/**
 * Update the state of the button, and cause a redraw. The state is a bitmask of STATE_*
 * @param newState
 */
void updateState(int newState)
{
	buttonState = newState;
	redraw();
}
/** Set a state */
#define setState(F) updateState(buttonState | (F))
/** Un-set a state */
#define unsetState(F) updateState(buttonState & ~(F))
/** Check a state */
#define hasState(F) (buttonState & (F))

/**
 * Determine if high-contrast is currently applied.
 * @return TRUE if the setting has changed.
 */
BOOL checkHighContrast()
{
	HIGHCONTRAST hc = { 0 };
	hc.cbSize = sizeof(hc);
	SystemParametersInfo(SPI_GETHIGHCONTRAST, hc.cbSize, &hc, 0);
	BOOL last = highContrast;
	highContrast = (hc.dwFlags & HCF_HIGHCONTRASTON) != 0;
	return highContrast != last;
}

/**
 * Find the gpii message window.
 * @return The window handle.
 */
HANDLE findGpiiWindow()
{
	gpiiWindow = FindWindow(GPII_CLASS, NULL);
	if (!gpiiWindow) {
		fail("Can't find gpii window");
	}
	return gpiiWindow;
}

/**
 * Send a message to the main GPII process.
 * @return TRUE if the window exists.
 */
BOOL sendToGpii(UINT msg, WPARAM wParam, LPARAM lParam)
{
	log("sendToGpii(%u,%u,%u)", msg, wParam, lParam);

	if (!IsWindow(gpiiWindow)) {
		findGpiiWindow();
	}

	if (gpiiWindow) {
		SendNotifyMessage(gpiiWindow, msg, wParam, lParam);
	}

	return gpiiWindow != NULL;
}

/**
 * Draws a translucent rectangle.
 * @param dc The device context to draw on.
 * @param rc The rectangle
 * @param color Rectangle colour
 * @param alpha Alpha amount, 0 (transparent) - 0xff (opaque)
 */
void AlphaRect(HDC dc, RECT rc, COLORREF color, BYTE alpha)
{
	// GDI doesn't have a concept of semi-transparent pixels - the only function that honours them is AlphaBlend.
	// Create a bitmap containing a single pixel, and use AlphaBlend to stretch it to the size of the rect.

	// The bitmap
	int pixel;
	BITMAPINFO bmi = { 0 };
	bmi.bmiHeader.biSize = sizeof(bmi.bmiHeader);
	bmi.bmiHeader.biWidth = bmi.bmiHeader.biHeight = 1;
	bmi.bmiHeader.biPlanes = 1;
	bmi.bmiHeader.biBitCount = 32;

	// The pixel
	pixel = (
		((alpha * GetRValue(color) / 0xff) << 16) |
		((alpha * GetGValue(color) / 0xff) << 8) |
		(alpha * GetBValue(color) / 0xff)
			);
	pixel = pixel | (alpha << 24);

	// Make the bitmap DC.
	int *bits;
	HDC dcPixel = CreateCompatibleDC(dc);
	HBITMAP bmpPixel = CreateDIBSection(dcPixel, &bmi, DIB_RGB_COLORS, &bits, null, 0);
	HBITMAP bmpOrig = SelectObject(dcPixel, bmpPixel);
	*bits = pixel;

	// Draw the "rectangle"
	BLENDFUNCTION bf = { AC_SRC_OVER, 0, 255, AC_SRC_ALPHA };
	AlphaBlend(dc, rc.left, rc.top, rc.right - rc.left, rc.bottom - rc.top, dcPixel, 0, 0, 1, 1, bf);

	SelectObject(dcPixel, bmpOrig);
	DeleteObject(bmpPixel);
	DeleteDC(dcPixel);
}

/**
 * Called from WM_PAINT to perform the drawing of the button.
 */
void paint()
{
	RECT rc;
	HDC dc, dcPaint;
	PAINTSTRUCT ps;

	GetClientRect(buttonWindow, &rc);

	// Start the buffer
	dcPaint = BeginPaint(buttonWindow, &ps);
	HPAINTBUFFER paintBuffer = BeginBufferedPaint(dcPaint, &rc, BPBF_TOPDOWNDIB, null, &dc);
	BufferedPaintClear(paintBuffer, null);

	int x = (rc.right - iconSize) / 2;
	int y = (rc.bottom - iconSize) / 2;

	if (highContrast) {
		UINT backcolor = COLOR_WINDOW;
		UINT forecolor = COLOR_WINDOWTEXT;

		if (hasState(STATE_CHECKED)) {
			forecolor = COLOR_HIGHLIGHT;
		}

		if (hasState(STATE_HOVER)) {
			backcolor = COLOR_HOTLIGHT;
			forecolor = COLOR_HIGHLIGHTTEXT;
		}

		// Get the real colour
		backcolor = GetSysColor(backcolor);
		forecolor = GetSysColor(forecolor);

		// Create an off-screen copy of the icon
		HDC dcBuf = CreateCompatibleDC(dc);

		// Make the colours of the icon what they need to be by manually changing each pixel
		// TODO: Pre-generate

		// Create a buffer bitmap
		BITMAPINFO bmi = { 0 };
		bmi.bmiHeader.biSize = sizeof(bmi.bmiHeader);
		bmi.bmiHeader.biWidth = rc.right;
		bmi.bmiHeader.biHeight = rc.bottom;
		bmi.bmiHeader.biPlanes = 1;
		bmi.bmiHeader.biBitCount = 32;

		UINT *pixels;
		HBITMAP bmpBuf = CreateDIBSection(dcBuf, &bmi, DIB_RGB_COLORS, (void **) &pixels, null, 0);
		HBITMAP origBmp = SelectObject(dcBuf, bmpBuf);

		// Clear the buffer
		AlphaRect(dcBuf, rc, 0, 255);
		// Draw the icon
		DrawIconEx(dcBuf, x, y, hIcon, iconSize, iconSize, 0, null, DI_NORMAL);

		// Change the pixels to the foreground colour, while taking the image's anti-aliasing into consideration.
		int len = rc.right * rc.bottom;
		UINT *p = pixels;

#define TO_RGB(C) ((C << 16) & 0xff0000) | (C & 0xff00) | ((C >> 16) & 0xff)
#define BLACK 0xff000000
#define WHITE 0xffffffff
		UINT bg = TO_RGB(backcolor), fg = TO_RGB(forecolor);
		BYTE r1 = GetRValue(fg), g1 = GetGValue(fg), b1 = GetBValue(fg);
		BYTE r2 = GetRValue(bg), g2 = GetGValue(bg), b2 = GetBValue(bg);

		for (int n = 0; n < len; n++, p++) {
			// Don't calculate full black or white
			if (*p == BLACK) {
				*p = bg;
			} else if (*p == WHITE) {
				*p = fg;
			} else {
				// Make a colour the same distance between the background and foreground as the original's distance
				// between black and white (assumes the original image is white on black).
				double a = (*p & 0xff) / 255.0;
				*p = RGB(
					r1 * a + r2 * (1.0 - a),
					g1 * a + g2 * (1.0 - a),
					b1 * a + b2 * (1.0 - a)
				);
			}
		}

		// buffer -> screen (buffer)
		AlphaRect(dc, rc, 0, 255);
		BitBlt(dc, 0, 0, rc.right, rc.bottom, dcBuf, 0, 0, SRCINVERT);

		SelectObject(dcBuf, origBmp);
		DeleteObject(bmpBuf);
		DeleteObject(dcBuf);

	} else {
		// Draw the not-high-contrast icon
		// Values come from what looks right.
		BYTE alpha = 0;
		if (hasState(STATE_PRESSED)) {
			alpha = 10;
		} else if (hasState(STATE_HOVER)) {
			alpha = 25;
		}

		if (alpha) {
			AlphaRect(dc, rc, RGB(255, 255, 255), alpha);
		}

		DrawIconEx(dc, x, y, hIcon, iconSize, iconSize, 0, 0, DI_NORMAL);
	}

	// Commit the buffer.
	EndBufferedPaint(paintBuffer, true);
	EndPaint(buttonWindow, &ps);
}

/**
 * Sets the icon.
 * @param file The icon file.
 */
void setImage(WCHAR *file)
{
	if (hIcon) {
		DestroyIcon(hIcon);
		hIcon = null;
	}

	// If the passed file points to the current one, then don't free+dup it
	if (iconFile != file) {
		if (iconFile) {
			LocalFree(iconFile);
		}
		iconFile = file ? StrDup(file) : null;
	}

	iconSize = fixDpi(ICON_SIZE);

	WCHAR *f = (highContrast && iconFileHC) ? iconFileHC : iconFile;
	if (iconSize && f) {
		hIcon = LoadImage(null, f, IMAGE_ICON, iconSize, iconSize, LR_LOADFROMFILE);
		if (!hIcon) {
			fail("LoadImage %p", f);
		}
	}

	positionTrayWindows(true);
}

/**
 * Sets the current tooltip
 * @param tooltip
 */
void setToolTip(WCHAR *tooltip)
{
    if (!tooltipWindow) {
        tooltipWindow = CreateWindowEx(0,
                                       TOOLTIPS_CLASS, NULL,
                                       WS_POPUP | TTS_ALWAYSTIP | TTS_NOPREFIX | TTS_BALLOON,
                                       0, 0,
                                       0, 0,
                                       buttonWindow,
                                       NULL, NULL, NULL);
    }

    TOOLINFO ti = { 0 };
    ti.cbSize = sizeof(ti);
    ti.hwnd = buttonWindow;
    ti.uFlags = TTF_SUBCLASS;
    ti.lpszText = tooltip;
    GetClientRect(buttonWindow, &ti.rect);

    SendMessage(tooltipWindow, TTM_ADDTOOL, 0, (LPARAM)&ti);
}

/**
 * Called when a message from gpii has been received.
 * @param id The command
 * @param data The data
 */
void gotGpiiMessage(DWORD id, WCHAR* data)
{
	log("gotGpiiMessage(%u,%s)", id, data);

	if (!gpiiWindow || !IsWindow(gpiiWindow)) {
		findGpiiWindow();
	}

	switch (id) {
	case GPII_COMMAND_ICON:
		setImage(data);
		break;
	case GPII_COMMAND_ICON_HC:
	    if (iconFileHC) {
	        LocalFree(iconFileHC);
	    }
	    iconFileHC = StrDup(data);

		setImage(iconFile);
		break;

	case GPII_COMMAND_TOOLTIP:
	    setToolTip(data);
		break;

	case GPII_COMMAND_STATE:
	{
		BOOL on = CompareStringOrdinal(data, -1, L"true", -1, true) == CSTR_EQUAL;
		if (on) {
			setState(STATE_CHECKED);
		} else {
			unsetState(STATE_CHECKED);
		}
		break;
	}
	case GPII_COMMAND_DESTROY:
		die = true;
		DestroyWindow(buttonWindow);
		PostQuitMessage(0);
		break;

	default:
		break;
	}
}

LRESULT CALLBACK buttonWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp)
{
	COPYDATASTRUCT *copyData;

	switch (msg) {
	case WM_CREATE:
		log("WM_CREATE");
		if (!buttonWindow) {
			buttonWindow = hwnd;
		}

		// Ask gpii for an update.
		sendToGpii(gpiiMessage, GPII_MSG_UPDATE, 0);
		break;

	case WM_COPYDATA:
		// A command from GPII.
		copyData = (COPYDATASTRUCT*)lp;
		if (copyData) {
			if (copyData->lpData) {
				// lpData should be a string - enforce the null at the end
				memset((char*)copyData->lpData + copyData->cbData - 2, 0, 2);
			}
			gotGpiiMessage(copyData->dwData, copyData->lpData);
		} else {
			fail("Got WM_COPYDATA with no data");
		}
		break;

	case WM_MOUSEMOVE:
		// Draw the highlight
		if (!hasState(STATE_HOVER)) {
			// Inform gpii
			sendToGpii(gpiiMessage, GPII_MSG_MOUSEENTER, 0);
			// Detect when the mouse leaves.
			TRACKMOUSEEVENT tme = { 0 };
			tme.cbSize = sizeof(tme);
			tme.dwFlags = TME_LEAVE;
			tme.hwndTrack = hwnd;
			TrackMouseEvent(&tme);

			setState(STATE_HOVER);
		}
	break;

	case WM_MOUSELEAVE:
		sendToGpii(gpiiMessage, GPII_MSG_MOUSELEAVE, 0);
		unsetState(STATE_HOVER | STATE_PRESSED);
		break;

	case WM_LBUTTONDOWN:
		setState(STATE_PRESSED);
		break;

	case WM_LBUTTONUP:
		// Activate the GPII window so the popup can take focus
		SetForegroundWindow(gpiiWindow);

		sendToGpii(gpiiMessage, GPII_MSG_CLICK, 0);
		unsetState(STATE_PRESSED);
		break;

	case WM_RBUTTONUP:
		// Activate the GPII window so the menu can take focus
		SetForegroundWindow(gpiiWindow);

		sendToGpii(gpiiMessage, GPII_MSG_SHOWMENU, 0);
		return 0;

	case WM_TIMER:
		debug("timer %u", wp);
		switch (wp) {
		case TIMER_CHECK:
			// Periodic checks that GPII still exists.
			if (gpiiWindow && !IsWindow(gpiiWindow)) {
				log("gpiiWindow no longer exists");
				PostQuitMessage(0);
				break;
			}
			SetTimer(buttonWindow, TIMER_CHECK, TIMER_CHECK_DELAY, null);
			redraw();
			// fall through
		case TIMER_RESIZE:
			positionTrayWindows(false);
			break;
		default:
			break;
		}
		break;

	case WM_SIZE:
	case WM_WINDOWPOSCHANGED:
		positionTrayWindows(true);
		break;

	case WM_ERASEBKGND:
		positionTrayWindows(false);
		break;

	case WM_PAINT:
		paint();
		break;

	case WM_DPICHANGED:
		// Set the current one to the given one (for < win10), then call getDpi to make the real check
		currentDpi = LOWORD(wp);
		getDpi(buttonWindow);
		setImage(iconFile);
		break;

	case WM_SETTINGCHANGE:
		if (checkHighContrast()) {
			// If high-contrast has changed, the icon will need to be reloaded.
			setImage(iconFile);
		}
		// fall through
	case WM_DISPLAYCHANGE:
		positionTrayWindows(true);
		break;

	case WM_NCDESTROY:
	case WM_DESTROY:
		PostQuitMessage(die ? 0 : 1);
		break;

	default:
		if (msg == shellMessage) {
			// The taskbar reacts to shell messages, so there's a good chance something will need to be redrawn.
			if (!positionTrayWindows(false)) {
				redraw();
			}
		}
		break;
	}

	return DefWindowProc(hwnd, msg, wp, lp);
}

#ifdef _DEBUG
int main(int argc, char **argv)
#else
int CALLBACK WinMain(HINSTANCE hInst, HINSTANCE hPrevInst, LPSTR cmd, int show)
#endif
{
	log("Started");

	// Used to communicate with GPII
	gpiiMessage = RegisterWindowMessage(BUTTON_MESSAGE);
	gpiiPositionMessage = RegisterWindowMessage(BUTTON_POSITION_MESSAGE);

	// See if there's already an instance
	HANDLE existing = FindWindowEx(getTaskbarWindow(), null, BUTTON_CLASS, null);
	if (existing) {
		log("Existing tray button found");

		// Tell it to die
		COPYDATASTRUCT copyData = { 0 };
		copyData.dwData = GPII_COMMAND_DESTROY;
		SendMessage(existing, WM_COPYDATA, 0, (LPARAM)&copyData);
	}

	WNDCLASS cls = { 0 };
	cls.cbWndExtra = sizeof(cls);
	cls.lpfnWndProc = buttonWndProc;
	cls.lpszClassName = BUTTON_CLASS;
	cls.hCursor = LoadCursor(NULL, IDC_ARROW);
	if (!RegisterClass(&cls)) {
		fail("RegisterClass");
	}

	if (BufferedPaintInit() != S_OK) {
		fail("BufferedPaintInit");
	}

	RegisterShellHookWindow(buttonWindow);
	shellMessage = RegisterWindowMessage(L"SHELLHOOK");

	log("Initialised");

	MSG msg = { 0 };
	do {
		// Wait for explorer to start
		HWND taskbar;
		int seconds = 0;
		while (!(taskbar = getTaskbarWindow())) {
			if (seconds++ == 100) {
				fail("No taskbar after %u seconds", seconds);
			}
			Sleep(1000);
		}

		log("Found taskbar");

		currentDpi = getDpi(taskbar);
		checkHighContrast();

		DWORD lastError = 0;
		do {
			// Create the button window
			buttonWindow = CreateWindowEx(
				WS_EX_TOOLWINDOW,
				BUTTON_CLASS,
				BUTTON_CLASS,
				WS_VISIBLE | WS_CHILD | WS_CLIPSIBLINGS | WS_TABSTOP,
				0, 0, BUTTON_WIDTH, 40,
				taskbar,
				null,
				0,
				null);

			if (!buttonWindow) {
				// Sometimes CreateWindowEx fails with ERROR_ACCESS_DENIED (can be reproduced if the start menu is open)
				// Also, creating without a parent but using SetParent returns ERROR_INVALID_PARAMETER, under the same
				// conditions.
				DWORD thisError = GetLastError();
				if (thisError != lastError) {
					fail("CreateWindowEx (retrying)");
					lastError = thisError;
				}
				Sleep(1000);
			}
			// Continue trying to create the window if it didn't succeed.
		} while (!buttonWindow);

		SetTimer(buttonWindow, TIMER_CHECK, TIMER_CHECK_DELAY, null);

		while (GetMessage(&msg, null, 0, 0))
		{
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}

		log("Window closed");
		// Re-create the window if it closes unexpectedly.
	} while (!die);

	hideButton();
	BufferedPaintUnInit();

	log("Stopped")

	return msg.wParam;
}
