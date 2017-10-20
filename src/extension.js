/*
 * GNOME Shell Extension: App Switcher Actions
 * Copyright (C) 2017  Davi da Silva Böger
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const Meta = imports.gi.Meta;
const St = imports.gi.St;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const AltTab = imports.ui.altTab;
const AppDisplay = imports.ui.appDisplay;
const BoxPointer = imports.ui.boxpointer;


// App switcher mods

let AppSwitcherPopup_keyPressHandler_orig;

const AppSwitcherPopup_keyPressHandler_mod = function(keysym, action) {
	if (!this._thumbnailsFocused && keysym == Clutter.Up) {
		this._select(this._selectedIndex, null, true);
		this._showSelectedActionsMenu();
		return Clutter.EVENT_STOP;
	}
	return AppSwitcherPopup_keyPressHandler_orig.apply(this, [keysym, action]);
};

const AppSwitcherPopup_showSelectedActionsMenu = function() {
	let appIcon = this._items[this._selectedIndex];
	let actionsMenu = this._getActionsMenu(appIcon);
	this._menuManager._changeMenu(actionsMenu);
	actionsMenu.firstMenuItem.setActive(true);
};

const AppSwitcherPopup_getActionsMenu = function(appIcon) {
	if (!appIcon._actionsMenu) {
		if (!this._menuManager) {
			this._menuManager = new PopupMenu.PopupMenuManager(this);
		}

		// AppIconMenu expects this function to be present
		appIcon.animateLaunch = function() {};

		let actionsMenu = new AppDisplay.AppIconMenu(appIcon);

		// hack to move the arrow to the bottom
		actionsMenu._arrowSide = St.Side.BOTTOM;
		actionsMenu._boxPointer._userArrowSide = St.Side.BOTTOM;
		actionsMenu._boxPointer._border.queue_repaint();

		// populate actionsMenu only once, since it is tied to short-lived popup
		actionsMenu._redisplay();
		// hack to remove leading separator for apps without open windows (i.e. Super+Tab Launcher's)
		// setActive(true) does not work on separators
		let firstItem = actionsMenu.firstMenuItem;
		while (firstItem instanceof PopupMenu.PopupSeparatorMenuItem) {
			firstItem.destroy();
			firstItem = actionsMenu.firstMenuItem;
		}

		actionsMenu.connect('open-state-changed', Lang.bind(this, _onActionsMenuOpenStateChanged));
		actionsMenu.connect('activate-window', Lang.bind(this, _onActionsMenuActivateWindow));
		actionsMenu.actor.connect('key-press-event', Lang.bind(this, _onActionsMenuActorKeyPressed));
		actionsMenu.actor.connect('key-release-event', Lang.bind(this, _onActionsMenuActorKeyReleased));

		this._menuManager.addMenu(actionsMenu);
		appIcon._actionsMenu = actionsMenu;
	}
	return appIcon._actionsMenu;
};

var _onActionsMenuOpenStateChanged = function(menu, open) {
	if (!open) {
		this._disableHover();
	}
	return Clutter.EVENT_PROPAGATE;
};

var _onActionsMenuActivateWindow = function(menu, window) {
	if (window) {
		Main.activateWindow(window);
	}
	this.destroy();
	return Clutter.EVENT_PROPAGATE;
};

var _onActionsMenuActorKeyPressed = function(actor, event) {
	let keysym = event.get_key_symbol();
	let keycode = event.get_key_code();
	let action = global.display.get_keybinding_action(keycode, event.get_state());
	if (action == Meta.KeyBindingAction.SWITCH_GROUP || action == Meta.KeyBindingAction.SWITCH_GROUP_BACKWARD) {
		this._menuManager._closeMenu(true, actor._delegate);
		this.actor.grab_key_focus();
		this._keyPressHandler(keysym, action);
		return Clutter.EVENT_STOP;
	} else if (keysym == Clutter.Right || action == Meta.KeyBindingAction.SWITCH_APPLICATIONS) {
		this._select(this._next(), null, true);
		this._showSelectedActionsMenu();
		return Clutter.EVENT_STOP;
	} else if (keysym == Clutter.Left || action == Meta.KeyBindingAction.SWITCH_APPLICATIONS_BACKWARD) {
		this._select(this._previous(), null, true);
		this._showSelectedActionsMenu();
		return Clutter.EVENT_STOP;
	} else if (keysym == Clutter.Up || keysym == Clutter.Down) {
		let menu = actor._delegate;
		let menuItems = menu._getMenuItems();
		let boundIndex = (keysym == Clutter.Up ? 0 : menuItems.length - 1);
		if (menuItems[boundIndex].active) {
			this._menuManager._closeMenu(true, menu);
			this.actor.grab_key_focus();
			return Clutter.EVENT_STOP;
		}
	}
	return Clutter.EVENT_PROPAGATE;
};

var _onActionsMenuActorKeyReleased = function(actor, event) {
	if (this._modifierMask) {
		let [x, y, mods] = global.get_pointer();
		let state = mods & this._modifierMask;
		if (state == 0) {
			let activeItem = actor._delegate._activeMenuItem;
			if (activeItem) {
				activeItem.activate(event);
				this.destroy();
			}
		}
	}
	return Clutter.EVENT_STOP;
};

// TODO: open actions menu when app icon is right-clicked

// extension functions

function init(metadata) {
}

function enable() {
	// App switcher mods
	AppSwitcherPopup_keyPressHandler_orig = AltTab.AppSwitcherPopup.prototype._keyPressHandler;
	AltTab.AppSwitcherPopup.prototype._keyPressHandler = AppSwitcherPopup_keyPressHandler_mod;

	AltTab.AppSwitcherPopup.prototype._getActionsMenu = AppSwitcherPopup_getActionsMenu;

	AltTab.AppSwitcherPopup.prototype._showSelectedActionsMenu = AppSwitcherPopup_showSelectedActionsMenu;
}

function disable() {
	// App switcher mods
	AltTab.AppSwitcherPopup.prototype._keyPressHandler = AppSwitcherPopup_keyPressHandler_orig;
	AppSwitcherPopup_keyPressHandler_orig = null;

	delete AltTab.AppSwitcherPopup.prototype._getActionsMenu;

	delete AltTab.AppSwitcherPopup.prototype._showSelectedActionsMenu;
}

