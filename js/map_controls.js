function addCustomMapControls(targetContainerId, mapInstance, isAmCharts5 = false) {
    // Remove any previously injected DOM buttons (cleanup from prior implementations)
    const parentContainer = document.getElementById(targetContainerId).parentElement;
    const oldControls = parentContainer.querySelector('.custom-map-controls');
    if (oldControls) {
        oldControls.remove();
    }

    const homePath = "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
    const exportPath = "M3,2 L13,2 L13,6 L15,8 L15,14 L3,14 L3,2 Z M11,2 L11,6 L15,6 L11,2 Z M4,11 L12,11 L12,12 L4,12 L4,11 Z M4,8 L10,8 L10,9 L4,9 L4,8 Z";

    if (isAmCharts5) {
        let root = mapInstance.root;

        // Remove existing control if any
        if (mapInstance.get("zoomControl")) {
            mapInstance.get("zoomControl").dispose();
        }

        let zoomControl = mapInstance.set("zoomControl", am5map.ZoomControl.new(root, {}));

        // Export SVG Button (placed above Home)
        let exportButton = zoomControl.children.insertIndex(0, am5.Button.new(root, {
            paddingTop: 10,
            paddingBottom: 10,
            tooltipText: "Export SVG",
            icon: am5.Graphics.new(root, {
                svgPath: exportPath,
                fill: am5.color(0x333333)
            })
        }));

        exportButton.events.on("click", function () {
            if (typeof am5exporting !== "undefined") {
                let exporting = am5exporting.Exporting.new(root, {
                    filePrefix: "map_export_" + new Date().getTime(),
                    dataSource: mapInstance.data
                });
                exporting.download("svg");
            } else {
                console.error("amCharts 5 Export plugin not loaded.");
            }
        });

        // Home Button
        let homeButton = zoomControl.children.insertIndex(1, am5.Button.new(root, {
            paddingTop: 10,
            paddingBottom: 10,
            tooltipText: "Reset Map",
            icon: am5.Graphics.new(root, {
                svgPath: homePath,
                fill: am5.color(0x333333)
            })
        }));

        homeButton.events.on("click", function () {
            mapInstance.goHome();
        });

        // Set grab cursor for the map wrapper to indicate it is draggable
        mapInstance.chartContainer.set("cursorOverStyle", "grab");
        mapInstance.chartContainer.get("background").events.on("pointerdown", function () {
            mapInstance.chartContainer.set("cursorOverStyle", "grabbing");
        });
        mapInstance.chartContainer.get("background").events.on("pointerup", function () {
            mapInstance.chartContainer.set("cursorOverStyle", "grab");
        });

        // Styling loop to match site theme
        [zoomControl.get("plusButton"), zoomControl.get("minusButton"), homeButton, exportButton].forEach(btn => {
            if (!btn) return;
            btn.get("background").setAll({
                fill: am5.color(0xffffff),
                stroke: am5.color(0xe0e0e0)
            });
            // Create hover state
            btn.get("background").states.create("hover", {
                fill: am5.color(0xc83830) // Main theme red
            });
            let icon = btn.get("icon");
            if (icon) {
                icon.states.create("hover", {
                    fill: am5.color(0xffffff)
                });
            }
        });

    } else {
        // amCharts 4 configuration
        if (mapInstance.zoomControl) {
            mapInstance.zoomControl.dispose();
        }

        mapInstance.zoomControl = new am4maps.ZoomControl();

        // Home Button
        var homeButton = new am4core.Button();
        homeButton.events.on("hit", function () {
            mapInstance.goHome();
        });
        homeButton.icon = new am4core.Sprite();
        homeButton.padding(7, 5, 7, 5);
        homeButton.width = 30;
        homeButton.icon.path = homePath;
        homeButton.marginBottom = 10;
        homeButton.parent = mapInstance.zoomControl;
        homeButton.insertBefore(mapInstance.zoomControl.plusButton);

        // Export SVG Button (placed above Home)
        var exportButton = new am4core.Button();
        exportButton.events.on("hit", function () {
            if (typeof am4plugins_export !== "undefined") {
                if (!mapInstance.exporting) {
                    mapInstance.exporting = new am4plugins_export.Exporting();
                }
                mapInstance.exporting.export("svg");
            } else {
                console.error("amCharts 4 Export plugin not loaded.");
            }
        });
        exportButton.icon = new am4core.Sprite();
        exportButton.padding(7, 5, 7, 5);
        exportButton.width = 30;
        exportButton.icon.path = exportPath;
        exportButton.marginBottom = 5;
        exportButton.parent = mapInstance.zoomControl;
        exportButton.insertBefore(homeButton);

        // Set grab cursor to clarify map panning
        mapInstance.cursorOverStyle = am4core.MouseCursorStyle.grab;
        mapInstance.cursorDownStyle = am4core.MouseCursorStyle.grabbing;

        // Apply theme styling
        let buttons = [mapInstance.zoomControl.plusButton, mapInstance.zoomControl.minusButton, homeButton, exportButton];
        buttons.forEach(btn => {
            if (!btn) return;
            // Native state
            btn.background.fill = am4core.color("#ffffff");
            btn.background.stroke = am4core.color("#e0e0e0");
            if (btn.icon) btn.icon.fill = am4core.color("#333333");
            if (btn.label) btn.label.fill = am4core.color("#333333");

            // Hover state
            var hs = btn.background.states.create("hover");
            hs.properties.fill = am4core.color("#c83830");

            btn.events.on("over", function (ev) {
                if (ev.target.icon) ev.target.icon.fill = am4core.color("#ffffff");
                if (ev.target.label) ev.target.label.fill = am4core.color("#ffffff");
            });

            btn.events.on("out", function (ev) {
                if (ev.target.icon) ev.target.icon.fill = am4core.color("#333333");
                if (ev.target.label) ev.target.label.fill = am4core.color("#333333");
            });
        });
    }
}
