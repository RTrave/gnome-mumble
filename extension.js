const Lang = imports.lang;
const Shell = imports.gi.Shell;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const extensionLocations = ["/usr", "~/.local"];

let Aim = imports.ui.appDisplay.AppIconMenu;
let origin;
let launcher_mumble;

function enable() {
    origin = Aim.prototype._redisplay;

    if(GLib.spawn_command_line_sync("which mumble")[3] === 0) {
        launcher_mumble = "Mumble-Overlay"
    } else {
        Main.notifyError("mumble-overlay", "Error: Mumble is not installed");

        return;
    }

    Aim.prototype._redisplay = function () {
        origin.call(this, arguments);

        this._mumble = new PopupMenu.PopupMenuItem(_(launcher_mumble));
        this.addMenuItem(this._mumble, this._getMenuItems()
            .indexOf(this._newWindowMenuItem) + 1);
        this._mumble.connect("activate", Lang.bind(this, function () {
            if(this._source.app.state == Shell.AppState.STOPPED) {
                this._source.animateLaunch();
            }

            Util.spawnApp([launcher_mumble.toLowerCase(), _getCommand(this._source.app.get_id())]);
            this.emit('activate-window', null);
        }));

    }
}

function disable() {
    Aim.prototype._redisplay = origin;
}

function _getCommand(file) {
    for(let i in extensionLocations) {
        try {
            let content = GLib.file_get_contents(extensionLocations[i] + "/share/applications/" + file)[1];
            let line = /Exec=.+/.exec(content)[0];

            return line.substr(5);
        } catch(error) {
            log(error);
        }
    }
}
