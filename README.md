# GNOME Shell Extension: App Switcher Actions

Press Up when switching apps with Alt+Tab (or Super+Tab) to show a menu with actions.

Git repository: https://github.com/dsboger/gnome-shell-extension-app-switcher-actions

E.g.o: https://extensions.gnome.org/extension/1324/app-switcher-actions/

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
