# Task tray button

Displays a button on the task tray, by shrinking the window list and positioning itself between that and the
notification area.

The taskbar is a window, having child windows like this: 

    [start][search][windows                 ][icons|clock]


The tray button is just another child window, inserted between the window list and icons:

    [start][search][windows         ][button][icons|clock]

## Build

Run `build.ps1`.

## How it works

There's nothing clever. A window is created, with the parent being the task tray. Then, the window list is re-sized to
make space. The only trouble is the shell not knowing about the button, so it sometimes re-adjusts the window list
back to where it should be.

The button is configured by the main gpii-app process, using [WM_COPYDATA](https://docs.microsoft.com/windows/desktop/dataxchg/wm-copydata):

|Data item|dwData|lpData|
|-|-|-|
|The current icon|1|Icon file, `NULL` to hide|
|High-contrast icon|2|High-contrast icon file|
|Tool tip|3|The text|
|Destroy the button|4|`NULL`|
|Keyed-in state|5|`"true"` or `"false"` (strings)|

The button sends the following notifications to the gpii-process, via the `GPII-TrayButton-Message` registered message:
|wParam|Action|
|-|-|
|0|Send an update of everything|
|1|Left button click|
|2|Right button click|


