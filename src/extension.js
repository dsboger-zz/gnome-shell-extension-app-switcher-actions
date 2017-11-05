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

const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const Gtk = imports.gi.Gtk;
const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const AltTab = imports.ui.altTab;
const AppDisplay = imports.ui.appDisplay;
const BoxPointer = imports.ui.boxpointer;

const Gettext = imports.gettext;

const GS_ = Gettext.domain('gnome-shell').gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Settings = ExtensionUtils.getCurrentExtension().imports.settings;

var switchActionsAction;
var switchActionsBackwardAction;

var AppActionsMenu = new Lang.Class({ // based on AppDisplay.AppIconMenu
	Name: 'AppActionsMenu',
	Extends: PopupMenu.PopupMenu,

	_init: function(source) {
		this.parent(source.actor, 0.5, St.Side.BOTTOM);
		this._source = source;
		source.actor.connect('notify::mapped', Lang.bind(this, function () {
			if (!source.actor.mapped)
				this.close();
		}));
		source.actor.connect('destroy', Lang.bind(this, this.destroy));
		Main.uiGroup.add_actor(this.actor);
	},

	_redisplay: function() {
		this.removeAll();

		if (!this._source.app.is_window_backed()) {
			let appInfo = this._source.app.get_app_info();
			let actions = appInfo.list_actions();
			if (this._source.app.can_open_new_window() &&
					actions.indexOf('new-window') == -1) {
				this._newWindowMenuItem = new PopupMenu.PopupMenuItem(GS_("New Window"));
				this.addMenuItem(this._newWindowMenuItem);
				this._newWindowMenuItem.connect('activate', Lang.bind(this, function() {
					this._source.app.open_new_window(-1);
				}));
			}

			if (AppDisplay.discreteGpuAvailable &&
					this._source.app.state == Shell.AppState.STOPPED &&
					actions.indexOf('activate-discrete-gpu') == -1) {
				this._onDiscreteGpuMenuItem = new PopupMenu.PopupMenuItem(GS_("Launch using Dedicated Graphics Card"));
				this.addMenuItem(this._onDiscreteGpuMenuItem);
				this._onDiscreteGpuMenuItem.connect('activate', Lang.bind(this, function() {
					this._source.app.launch(0, -1, true);
				}));
			}

			for (let i = 0; i < actions.length; i++) {
				let action = actions[i];
				let item = new PopupMenu.PopupMenuItem(appInfo.get_action_name(action));
				this.addMenuItem(item);
				item.connect('activate', Lang.bind(this, function(emitter, event) {
					this._source.app.launch_action(action, event.get_time(), -1);
				}));
			}
		}

		/*
		 * Extension point for other GNOME Shell extensions that might want to
		 * include actions in the actions menu.
		 *
		 * Just add a new entry in the object Main._appSwitcherActionsExtension
		 * (possibly creating it if not existing already).
		 *
		 * Example:
		 *
		 * 	if (!Main._appSwitcherActionsExtension) {
		 * 		Main._appSwitcherActionsExtension = {};
		 * 	}
		 * 	Main._appSwitcherActionsExtension.someExtensionActions = [
		 * 		{
		 *			label: _("Do Something With This App"),
		 * 			action: Lang.bind(this, this._doSomethingWithThisApp),
		 * 			condition: function(app) { return true; } // works for every app (even not running!), could be omitted
		 * 		},
		 * 		{
		 *			label: _("Do Something Else"),
		 * 			action: Lang.bind(this, this._doSomethingElse),
		 * 			condition: function(app) { return app.get_n_windows() > 0; } // works for every running app
		 * 		},
		 * 		{
		 *			label: _("Do Something With Firefox"),
		 * 			action: Lang.bind(this, this._doSomethingWithFirefox),
		 * 			condition: function(app) { return app.get_id() == "firefox.desktop"; } // works only for Firefox
		 * 		},
		 *	];
		 */
		if (Main._appSwitcherActionsExtension) {
			for (let extKey in Main._appSwitcherActionsExtension) {
				let itemSpecs = Main._appSwitcherActionsExtension[extKey];
				for (let i = 0; i < itemSpecs.length; i++) {
					let itemSpec = itemSpecs[i];
					if (itemSpec.label && itemSpec.action && (!itemSpec.condition || itemSpec.condition(this._source.app))) {
						let item = new PopupMenu.PopupMenuItem(itemSpec.label);
						this.addMenuItem(item);
						let app = this._source.app;
						item.connect('activate', function(source, event) { itemSpec.action(source, event, app); });
					}
				}
			}
		}

		if (this._source.app.get_n_windows() > 0) {
			if (this.numMenuItems > 0) {
				this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			}

			this._quitMenuItem = new PopupMenu.PopupMenuItem(GS_("Quit"));
			this.addMenuItem(this._quitMenuItem);
			this._quitMenuItem.connect('activate', Lang.bind(this, function() {
				this._source.app.request_quit();
			}));
		}
	}

});

// Window manager "mods"

var _startSwitcher = function(display, screen, window, binding) { // adapted from WindowManager._startSwitcher
	/* prevent a corner case where both popups show up at once */
	if (this._workspaceSwitcherPopup != null) {
		this._workspaceSwitcherPopup.destroy();
	}

	let tabPopup = new AltTab.AppSwitcherPopup();

	if (!tabPopup.show(binding.is_reversed(), binding.get_name(), binding.get_mask())) {
		tabPopup.destroy();
	}
};

// App switcher mods

let AppSwitcherPopup_initialSelection_orig;
let AppSwitcherPopup_keyPressHandler_orig;

const AppSwitcherPopup_initialSelection_mod = function(backward, binding) {
	// this only happens once for each time the popup is created
	// we should monkey-patch _init instead, but this works and I'm lazy :)
	if (this._switcherList && this._switcherList._items) {
		let items = this._switcherList._items;
		for (let i = 0; i < items.length; i++) {
			items[i].connect('button-press-event', Lang.bind(this, _onSwitcherListItemButtonPressEvent, i));
		}
	}
	if (binding == 'switch-actions') {
		this._select(0, null, true);
		this._showSelectedActionsMenu();
	} else if (binding == 'switch-actions-backward') {
		this._select(0, null, true);
		this._showSelectedActionsMenu(Gtk.DirectionType.UP);
	} else {
		AppSwitcherPopup_initialSelection_orig.apply(this, [backward, binding]);
	}
};

const _onSwitcherListItemButtonPressEvent = function(actor, event, i) {
	if (event.get_button() == 3) {
		this._select(i, null, true);
		this._showSelectedActionsMenu();
		return Clutter.EVENT_STOP;
	}
	return Clutter.EVENT_PROPAGATE;
};

const AppSwitcherPopup_keyPressHandler_mod = function(keysym, action) {
	if (!this._thumbnailsFocused && keysym == Clutter.Up || action == switchActionsAction || action == switchActionsBackwardAction) {
		this._select(this._selectedIndex, null, true);
		this._showSelectedActionsMenu(action == switchActionsBackwardAction ? Gtk.DirectionType.UP : null);
		return Clutter.EVENT_STOP;
	}
	return AppSwitcherPopup_keyPressHandler_orig.apply(this, [keysym, action]);
};

const AppSwitcherPopup_showSelectedActionsMenu = function(direction) {
	let appIcon = this._items[this._selectedIndex];
	let actionsMenu = this._getActionsMenu(appIcon);
	if (actionsMenu) {
		this._menuManager._changeMenu(actionsMenu);
		this._menuManager.ignoreRelease(); // avoid closing the menu when opening with right click
		if (direction == Gtk.DirectionType.UP) {
			let actionsMenuItems = actionsMenu._getMenuItems();
			actionsMenuItems[actionsMenuItems.length - 1].setActive(true);
		} else {
			actionsMenu.firstMenuItem.setActive(true);
		}
	}
};

const AppSwitcherPopup_getActionsMenu = function(appIcon) {
	if (!appIcon._actionsMenu) {
		if (!this._menuManager) {
			this._menuManager = new PopupMenu.PopupMenuManager(this);
		}

		let actionsMenu = new AppActionsMenu(appIcon);
		actionsMenu._redisplay();
		if (actionsMenu.numMenuItems == 0) {
			actionsMenu.destroy();
			return null;
		}

		actionsMenu.connect('open-state-changed', Lang.bind(this, _onActionsMenuOpenStateChanged));
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

var _onActionsMenuActorKeyPressed = function(actor, event) {
	let keysym = event.get_key_symbol();
	let keycode = event.get_key_code();
	let action = global.display.get_keybinding_action(keycode, event.get_state());
	if (action == Meta.KeyBindingAction.SWITCH_GROUP || action == Meta.KeyBindingAction.SWITCH_GROUP_BACKWARD
			|| action == Meta.KeyBindingAction.SWITCH_APPLICATIONS || action == Meta.KeyBindingAction.SWITCH_APPLICATIONS_BACKWARD) {
		this._menuManager._closeMenu(true, actor._delegate);
		this.actor.grab_key_focus();
		this._keyPressHandler(keysym, action);
		return Clutter.EVENT_STOP;
	} else if (keysym == Clutter.Up || keysym == Clutter.Down || action == switchActionsAction || action == switchActionsBackwardAction) {
		let menu = actor._delegate;
		let menuItems = menu._getMenuItems();
		let boundItem;
		if (keysym == Clutter.Up || action == switchActionsBackwardAction) {
			boundItem = menuItems[0];
		} else {
			boundItem = menuItems[menuItems.length - 1];
			while (boundItem instanceof PopupMenu.PopupSubMenuMenuItem && boundItem.menu.isOpen && !boundItem.menu.isEmpty()) {
				let subMenuItems = boundItem.menu._getMenuItems();
				boundItem = subMenuItems[subMenuItems.length - 1];
			}
		}
		if (boundItem.active) {
			this._menuManager._closeMenu(true, menu);
			this.actor.grab_key_focus();
			return Clutter.EVENT_STOP;
		} else if (action == switchActionsAction) {
			actor.navigate_focus(menu._activeMenuItem.actor, Gtk.DirectionType.DOWN, false);
			return Clutter.EVENT_STOP;
		} else if (action == switchActionsBackwardAction) {
			actor.navigate_focus(menu._activeMenuItem.actor, Gtk.DirectionType.UP, false);
			return Clutter.EVENT_STOP;
		}
	}
	return Clutter.EVENT_PROPAGATE;
};

var _onActionsMenuActorKeyReleased = function(actor, event) { // based on SwitcherPopup._keyReleaseEvent
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

// extension functions

function init(metadata) {
}

function enable() {
	// Keybindings
	let settings = Settings.initSettings();

	switchActionsAction = Main.wm.addKeybinding('switch-actions',
			settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL,
			Lang.bind(Main.wm, _startSwitcher));
	switchActionsBackwardAction = Main.wm.addKeybinding('switch-actions-backward',
			settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL,
			Lang.bind(Main.wm, _startSwitcher));

	// App switcher mods
	AppSwitcherPopup_initialSelection_orig = AltTab.AppSwitcherPopup.prototype._initialSelection;
	AltTab.AppSwitcherPopup.prototype._initialSelection = AppSwitcherPopup_initialSelection_mod;

	AppSwitcherPopup_keyPressHandler_orig = AltTab.AppSwitcherPopup.prototype._keyPressHandler;
	AltTab.AppSwitcherPopup.prototype._keyPressHandler = AppSwitcherPopup_keyPressHandler_mod;

	AltTab.AppSwitcherPopup.prototype._getActionsMenu = AppSwitcherPopup_getActionsMenu;

	AltTab.AppSwitcherPopup.prototype._showSelectedActionsMenu = AppSwitcherPopup_showSelectedActionsMenu;
}

function disable() {
	// Keybindings
	Main.wm.removeKeybinding('switch-actions');
	switchActionsAction = null;

	Main.wm.removeKeybinding('switch-actions-backward');
	switchActionsBackwardAction = null;

	Settings.destroySettings();

	// App switcher mods
	AltTab.AppSwitcherPopup.prototype._initialSelection = AppSwitcherPopup_initialSelection_orig;
	AppSwitcherPopup_initialSelection_orig = null;

	AltTab.AppSwitcherPopup.prototype._keyPressHandler = AppSwitcherPopup_keyPressHandler_orig;
	AppSwitcherPopup_keyPressHandler_orig = null;

	delete AltTab.AppSwitcherPopup.prototype._getActionsMenu;

	delete AltTab.AppSwitcherPopup.prototype._showSelectedActionsMenu;
}

