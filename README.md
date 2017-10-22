# GNOME Shell Extension: App Switcher Actions

Access a menu with app actions from the app switcher (Super+Tab or Alt+Tab popup).

Git repository: https://github.com/dsboger/gnome-shell-extension-app-switcher-actions

E.g.o: https://extensions.gnome.org/extension/1324/app-switcher-actions/

## Usage

The actions menu can be brought up in a few different ways:

- Pressing Super+1 (or Alt+1) will show the app switcher with the actions menu
open for the currently focused app
- When the app switcher is already visible by pessing Super+Tab, Alt+Tab, Super+AboveTab ou Alt+AboveTab,
pressing Super+1 (or Alt+1) will open the actions menu for the currently selected app in the popup
- Pressing Up in the app switcher will also open the actions menu for the currently selected app

The actions menu can be navigated with the Up and Down arrows or by priming Super+1, Alt+1, Super+Shift+1 or
Alt+Shift+1 repeatedly. Pressing Esc or moving past the bounds of the menu will close it and bring back
focus to the app icon in the switcher.

## Settings

The extension settings panel can be used to customize the keyboard shortcuts Super+1 (Alt+1) and Super+Shift+1
(Alt+Shift+1). Keep in mind, though, that these shortcuts are integrated with the app switcher ones, so the
same modifier must be used. For example, if you only use Alt+Tab and Alt+Shift+Tab for the app switcher, then
using Super+1 and Super+Shift+1 for the actions menu will not work.

## Notes

 - App Switcher Actions was tested with GNOME Shell 3.26
 - It may (and probably will) interfere with other extensions that also modify Super+Tab (or Alt+Tab) app switcher. This scenario was not tested yet. If you find an incompatibility that you would like to see fixed, please file a bug report!

## Installation

You may simply go to the e.g.o URL above and install the latest, reviewed release of App Switcher Actions. It is also possible to install from the Git repository by cloning (or downloading a release snapshot) and running the following commands from the root folder:


```
./autogen.sh
./configure
make localinstall
```

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
