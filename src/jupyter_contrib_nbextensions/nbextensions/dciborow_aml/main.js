define([
    'jquery',
    'base/js/dialog',
    'base/js/events',
    'base/js/namespace',
    'notebook/js/celltoolbar',
    'notebook/js/codecell',
], function (
    $,
    dialog,
    events,
    Jupyter,
    celltoolbar,
    codecell
) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var mod_name_py = 'python_cell';
    var mod_name_r = 'r_cell';
    var log_prefix = '[' + mod_name_py + ' & ' + mod_name_r + ']';
    var options = { // updated from server's config & nb metadata
        run_on_kernel_ready: true,
    };

    var toolbar_preset_name = 'Code Type Cell';
    var python_checkbox = "Python";
    var r_checkbox = "R";
    var deep_checkbox = "Deep";
    var bash_checkbox = "Bash";


    var python_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
        python_checkbox,
        function setter(cell, value) {
            if (value) {
                cell.metadata.python_cell = true;
            } else {
                delete cell.metadata.python_cell;
            }
        },
        function getter(cell) {
            // if python_cell is undefined, it'll be interpreted as false anyway
            return cell.metadata.python_cell;
        }
    );

    var r_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
        r_checkbox,
        function setter(cell, value) {
            if (value) {
                cell.metadata.r_cell = true;
            } else {
                delete cell.metadata.r_cell;
            }
        },
        function getter(cell) {
            // if python_cell is undefined, it'll be interpreted as false anyway
            return cell.metadata.r_cell;
        }
    );

    var dl_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
        deep_checkbox,
        function setter(cell, value) {
            if (value) {
                cell.metadata.dl_cell = true;
            } else {
                delete cell.metadata.dl_cell;
            }
        },
        function getter(cell) {
            // if python_cell is undefined, it'll be interpreted as false anyway
            return cell.metadata.dl_cell;
        }
    );

    var bash_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
        bash_checkbox,
        function setter(cell, value) {
            if (value) {
                cell.metadata.bash_cell = true;
            } else {
                delete cell.metadata.bash_cell;
            }
        },
        function getter(cell) {
            // if python_cell is undefined, it'll be interpreted as false anyway
            return cell.metadata.bash_cell;
        }
    );

    function show_all_cells() {
        console.log(log_prefix, 'Setting Cell Visibility');
        var num = 0;
        var cells = Jupyter.notebook.get_cells();
        for (var ii = 0; ii < cells.length; ii++) {
            var cell = cells[ii];
            cell.element.show();
            cell.element.find("div.input").show();
            cell.element.find("div.output").show();
        }
        console.log(log_prefix, 'finished running ' + num + ' show cell' + (num !== 1 ? 's' : ''));
    }

    function show_hide_cells() {
        console.log(log_prefix, 'Setting Cell Visibility');
        var num = 0;
        var cells = Jupyter.notebook.get_cells();
        for (var ii = 0; ii < cells.length; ii++) {
            var cell = cells[ii];
            if (cell.metadata.python_cell === true) {
                if (Jupyter.notebook.metadata.kernelspec.language != 'python') {
                    cell.element.find("div.input").hide();
                    cell.element.find("div.output").hide();
                    cell.element.hide();
                } else {
                    cell.element.show();
                    cell.element.find("div.input").show();
                    cell.element.find("div.output").show();
                }
            }
            if (cell.metadata.r_cell === true) {
                if (Jupyter.notebook.metadata.kernelspec.language == 'python') {
                    cell.element.find("div.input").hide();
                    cell.element.find("div.output").hide();
                    cell.element.hide();
                } else {
                    cell.element.show();
                    cell.element.find("div.input").show();
                    cell.element.find("div.output").show();
                }
            }
            if (cell.metadata.bash_cell === true) {
                if (Jupyter.notebook.metadata.kernelspec.language != 'Bash') {
                    cell.element.find("div.input").hide();
                    cell.element.find("div.output").hide();
                    cell.element.hide();
                } else {
                    cell.element.show();
                    cell.element.find("div.input").show();
                    cell.element.find("div.output").show();
                }
            }
        }
        console.log(log_prefix, 'finished running ' + num + ' show cell' + (num !== 1 ? 's' : ''));
    }

    var load_ipython_extension = function () {
        // register action
        var prefix = 'auto';
        var action_name = 'show_all_cells';
        var action = {
            icon: 'fa-calculator',
            help: 'Show All Code Cells',
            help_index: 'zz',
            handler: show_all_cells
        };
        var action_full_name = Jupyter.notebook.keyboard_manager.actions.register(action, action_name, prefix);

        // add toolbar button
        Jupyter.toolbar.add_buttons_group([action_full_name]);

        // setup things to run on loading config/notebook
        Jupyter.notebook.config.loaded
            .then(function update_options_from_config() {
                $.extend(true, options, Jupyter.notebook.config.data[mod_name_py]);
            }, function (reason) {
                console.warn(log_prefix, 'error loading config:', reason);
            })
            .then(function () {
                if (Jupyter.notebook._fully_loaded) {
                    callback_notebook_loaded();
                }
                events.on('notebook_loaded.Notebook', callback_notebook_loaded);
            }).catch(function (reason) {
            console.error(log_prefix, 'unhandled error:', reason);
        });
    };

    function callback_notebook_loaded() {
        // update from metadata
        var md_opts = Jupyter.notebook.metadata[mod_name_py];
        if (md_opts !== undefined) {
            console.log(log_prefix, 'updating options from notebook metadata:', md_opts);
            $.extend(true, options, md_opts);
        }

        // register celltoolbar presets if they haven't been already
        if (CellToolbar.list_presets().indexOf(toolbar_preset_name) < 0) {
            // Register a callback to create a UI element for a cell toolbar.
            CellToolbar.register_callback('python_cell.is_python_cell', python_cell_ui_callback, 'code');
            CellToolbar.register_callback('r_cell.is_r_cell', r_cell_ui_callback, 'code');
            CellToolbar.register_callback('dl_cell.is_dl_cell', dl_cell_ui_callback, 'code');
            CellToolbar.register_callback('bash_cell.is_dl_cell', bash_cell_ui_callback, 'code');
            // Register a preset of UI elements forming a cell toolbar.
            CellToolbar.register_preset("Code Cell Type", ['python_cell.is_python_cell', 'r_cell.is_r_cell', 'dl_cell.is_dl_cell', 'bash_cell.is_dl_cell'], Jupyter.notebook);

        }
        if (options.run_on_kernel_ready) {
            show_hide_code_cells_asap()
        }
    }

    function show_hide_code_cells_asap() {
        if (Jupyter.notebook && Jupyter.notebook.kernel && Jupyter.notebook.kernel.info_reply.status === 'ok') {
            // kernel is already ready
            show_hide_cells();
        }
        // whenever a (new) kernel  becomes ready, run all initialization cells
        events.on('kernel_ready.Kernel', show_hide_cells);
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});
