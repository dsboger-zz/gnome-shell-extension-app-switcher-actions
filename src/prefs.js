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


const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gettext = imports.gettext;
var Dazzle;
try {
	//Dazzle = imports.gi.Dazzle;
} catch (e) {
	// continue without Dazzle
}

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const Settings = ExtensionUtils.getCurrentExtension().imports.settings;

const TRANSLATION_DOMAIN = 'gnome-shell-extension-app-switcher-actions';
const GCC_ = Gettext.domain('gnome-control-center-2.0').gettext;

var box = null;
var _toplevel = null;

function _getExtensionSettingsToplevel() {
	if (!_toplevel && box) {
		_toplevel = box.get_toplevel();
		if (!_toplevel.is_toplevel()) {
			_toplevel = null;
		}
	}
	return _toplevel;
}

function _editShortcut(row, shortcutKey, shortcutSummary, settings) {
	let toplevel = _getExtensionSettingsToplevel();
	if (Dazzle) {
		let dialog = new Dazzle.ShortcutAccelDialog({ transient_for: toplevel, shortcut_title: shortcutSummary });
		if (dialog.run() == Gtk.ResponseType.ACCEPT) {
			if (dialog.accelerator) {
				settings.set_strv(shortcutKey, [dialog.accelerator]);
			} else {
				settings.set_strv(shortcutKey, []);
			}
		}
		dialog.destroy();
	} else {
		let dialog = new Gtk.MessageDialog({ transient_for: toplevel, message_type: Gtk.MessageType.QUESTION, buttons: Gtk.ButtonsType.CANCEL,
				title: GCC_("Set Shortcut"), text: GCC_("Enter new shortcut to change <b>%s</b>.").format(shortcutSummary), use_markup: true });
		dialog.add_button(GCC_("Set"), Gtk.ResponseType.ACCEPT);

		let entry = new Gtk.Entry({ visible: true, text: settings.get_strv(shortcutKey).toString() });
		entry.connect('activate', function() {
					dialog.response(Gtk.ResponseType.ACCEPT);
				});
		dialog.get_message_area().pack_start(entry, false, false, 0);
		if (dialog.run() == Gtk.ResponseType.ACCEPT) {
			settings.set_strv(shortcutKey, entry.text.split(','));
		}
		dialog.destroy();
	}
}

function _createShortcutRow(shortcutKey, settings) {
	let schemaKey = settings.settings_schema.get_key(shortcutKey);
	let shortcutSummary = schemaKey.get_summary();

	let row = new Gtk.ListBoxRow({ visible: true });
	{
		let shortcutBox = new Gtk.Box({ visible: true, orientation: Gtk.Orientation.HORIZONTAL, margin: 20, spacing: 10 });
		{
			let shortcutNameLabel = new Gtk.Label({ visible: true, halign: Gtk.Align.START, label: shortcutSummary });
			shortcutBox.pack_start(shortcutNameLabel, true, true, 0);
		}
		{
			let shortcuts = settings.get_strv(shortcutKey);
			if (Dazzle) {
				let shortcut = shortcuts.length > 0 ? shortcuts[0] : null;
				let shortcutValueLabel = new Dazzle.ShortcutLabel({ visible: true, accelerator: shortcut });
				shortcutValueLabel.get_style_context().add_class('dim-label');
				let settingChangedId = settings.connect("changed::" + shortcutKey, function() {
							let shortcuts = settings.get_strv(shortcutKey);
							shortcutValueLabel.accelerator = shortcuts.length > 0 ? shortcuts[0] : null;
						});
				row.connect('destroy', function() { settings.disconnect(settingChangedId); });
				shortcutBox.pack_start(shortcutValueLabel, false, false, 0);
			} else {
				let shortcutValueLabel = new Gtk.Label({ visible: true, label: shortcuts.toString() });
				shortcutValueLabel.get_style_context().add_class('dim-label');
				let settingChangedId = settings.connect("changed::" + shortcutKey, function() {
							shortcutValueLabel.label = settings.get_strv(shortcutKey).toString();
						});
				row.connect('destroy', function() { settings.disconnect(settingChangedId); });
				shortcutBox.pack_start(shortcutValueLabel, false, false, 0);
			}
		}
		{
			let resetShortcutImage = new Gtk.Image({ visible: true, icon_name: 'edit-clear-symbolic', icon_size: Gtk.IconSize.BUTTON });
			let resetShortcutButton = new Gtk.Button({ visible: true, image: resetShortcutImage,
					tooltip_text: GCC_("Reset the shortcut to its default value") });
			resetShortcutButton.get_style_context().add_class('flat');
			resetShortcutButton.connect('clicked', function() {
						settings.reset(shortcutKey);
					});
			shortcutBox.pack_start(resetShortcutButton, false, false, 0);
		}
		row.add(shortcutBox);
	}

	row._onActivate = function() { _editShortcut(row, shortcutKey, shortcutSummary, settings); };
	return row;
}

function buildPrefsWidget() {
	let settings = Settings.initSettings();

	box = new Gtk.Box({ visible: true, orientation: Gtk.Orientation.VERTICAL, margin: 20 });
	{
		let innerBox = new Gtk.Box({ visible: true, orientation: Gtk.Orientation.VERTICAL, halign: Gtk.Align.CENTER, spacing: 20 });
		{
			let shortcutsLabel = new Gtk.Label({ visible: true, halign: Gtk.Align.START, label: GCC_("Keyboard Shortcuts") });
			innerBox.pack_start(shortcutsLabel, false, false, 0);
		}
		{
			let frame = new Gtk.Frame({ visible: true, width_request: 500, halign: Gtk.Align.CENTER });
			{
				let listBox = new Gtk.ListBox({ visible: true, selection_mode: Gtk.SelectionMode.NONE, activate_on_single_click: true });
				{
					listBox.add(_createShortcutRow('switch-actions', settings));
					listBox.add(_createShortcutRow('switch-actions-backward', settings));
				}
				listBox.connect('row-activated', function(list, row) { row._onActivate(); });
				frame.add(listBox);
			}
			innerBox.pack_start(frame, false, false, 0);
		}
		box.pack_start(innerBox, false, false, 0);
	}

	return box;
}

function init() {
	box = null;
    _toplevel = null;
}

