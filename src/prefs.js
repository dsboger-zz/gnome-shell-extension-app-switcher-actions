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

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const Settings = ExtensionUtils.getCurrentExtension().imports.settings;

const TRANSLATION_DOMAIN = 'gnome-shell-extension-app-switcher-actions';
const _ = Gettext.domain(TRANSLATION_DOMAIN).gettext;


function init() {
	let extension = ExtensionUtils.getCurrentExtension();
	let localeDir = extension.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain(TRANSLATION_DOMAIN, localeDir.get_path());
    else
        Gettext.bindtextdomain(TRANSLATION_DOMAIN, Config.LOCALEDIR);
}

var box;

function _editShortcut(row, shortcutKey, settings) {
	let parent = box.get_toplevel();
	if (!parent.is_toplevel()) {
		parent = null;
	}
	let dialog = new Gtk.MessageDialog({transient_for: parent, message_type: Gtk.MessageType.QUESTION, buttons: Gtk.ButtonsType.OK_CANCEL,
			title: _("Edit Shortcut"),  text: _("Select a new keyboard shortcut")});

	let entry = new Gtk.Entry({visible: true});
	entry.text = settings.get_strv(shortcutKey).toString();
	dialog.get_message_area().pack_start(entry, false, false, 0);
	if (dialog.run() == Gtk.ResponseType.OK) {
		let newShortcuts = entry.text.split(',');
		settings.set_strv(shortcutKey, newShortcuts);
		row._shortcutValueLabel.label = entry.text;
	}
	dialog.destroy();
}

function _createShortcutRow(shortcutKey, settings) {
	let row = new Gtk.ListBoxRow();
	row.visible = true;
	{
		let shortcutBox = new Gtk.Box();
		shortcutBox.orientation = Gtk.Orientation.HORIZONTAL;
		shortcutBox.visible = true;
		shortcutBox.margin = 25;
		{
			let schemaKey = settings.settings_schema.get_key(shortcutKey);
			let shortcutSummary = schemaKey.get_summary();
			let shortcutNameLabel = Gtk.Label.new(shortcutSummary);
			shortcutNameLabel.visible = true;
			shortcutNameLabel.halign = Gtk.Align.START;
			shortcutBox.pack_start(shortcutNameLabel, true, true, 0);
		}
		{
			let switchActionsShortcut = settings.get_strv(shortcutKey).toString();
			let shortcutValueLabel = Gtk.Label.new(switchActionsShortcut);
			shortcutValueLabel.visible = true;
			shortcutValueLabel.get_style_context().add_class('dim-label');
			row._shortcutValueLabel = shortcutValueLabel;
			shortcutBox.pack_start(shortcutValueLabel, false, false, 0);
		}
		row.add(shortcutBox);
	}

	row._onActivate = function() { _editShortcut(row, shortcutKey, settings); };
	return row;
}

function buildPrefsWidget() {
	let settings = Settings.initSettings();

	box = new Gtk.Box();
	box.orientation = Gtk.Orientation.VERTICAL;
	box.visible = true;
	box.margin = 20;
	{
		let innerBox = new Gtk.Box();
		innerBox.orientation = Gtk.Orientation.VERTICAL;
		innerBox.visible = true;
		innerBox.halign = Gtk.Align.CENTER;
		innerBox.spacing = 20;
		{
			let shortcutsLabel = Gtk.Label.new(_("Keyboard Shortcuts"));
			shortcutsLabel.visible = true;
			shortcutsLabel.halign = Gtk.Align.START;
			shortcutsLabel.get_style_context().add_class('title');
			innerBox.pack_start(shortcutsLabel, false, false, 0);
		}
		{
			let frame = new Gtk.Frame();
			frame.visible = true;
			frame.width_request = 500;
			frame.halign = Gtk.Align.CENTER;
			{
				let listBox = new Gtk.ListBox();
				listBox.visible = true;
				listBox.selection_mode = Gtk.SelectionMode.NONE;
				listBox.activate_on_single_click = true;
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
