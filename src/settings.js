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

const ExtensionUtils = imports.misc.extensionUtils;

var settings;

var initSettings = function() { // adapted from famed convenience.js
	if (!settings) {
		let extension = ExtensionUtils.getCurrentExtension();
		let schemaDir = extension.dir.get_child('schemas');
		let schemaSource;
		if (schemaDir.query_exists(null)) { // local installation
			schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir.get_path(),
					Gio.SettingsSchemaSource.get_default(), false);
		} else { // schema is in default system path
			schemaSource = Gio.SettingsSchemaSource.get_default();
		}
		let schemaObj = schemaSource.lookup('org.gnome.shell.extensions.app-switcher-actions',
											true);
		if (!schemaObj) {
			throw new Error('Schema ' + schema + ' could not be found for extension '
							+ extension.metadata.uuid + '. Please check your installation.');
		}

		settings = new Gio.Settings({ settings_schema: schemaObj });
	}
	return settings;
}

var destroySettings = function() {
	settings.run_dispose();
	settings = null;
}
