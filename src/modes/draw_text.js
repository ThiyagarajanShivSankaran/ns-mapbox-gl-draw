import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';

const DrawText = {};

DrawText.onSetup = function() {
    const point = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
            type: Constants.geojsonTypes.POINT,
            coordinates: []
        }
    });

    this.addFeature(point);

    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POINT);

    this.setActionableState({
        trash: true
    });

    return { point };
};

DrawText.stopDrawingAndRemove = function(state) {
    this.deleteFeature([state.point.id], { silent: true });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawText.onTap = DrawText.onClick = function (state, e) {
    const map = this.map;
    this.updateUIClasses({ mouse: Constants.cursors.MOVE });
    state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);

    // First, try to remove any existing form container
    const existingContainer = document.getElementById("mapbox-gl-draw-text-form-container");
    if (existingContainer) {
        existingContainer.remove(); // Remove the existing form if it's there
    }

    const pixels = map.project(e.lngLat);
    const formContainer = document.createElement("div");
    formContainer.id = "mapbox-gl-draw-text-form-container"; // Unique identifier for the form container
    formContainer.style.position = "absolute";
    formContainer.style.left = `${pixels.x}px`;
    formContainer.style.top = `${pixels.y}px`;
    formContainer.style.zIndex = "10";
    formContainer.style.display = "block";

    const form = document.createElement("form");
    form.id = "text-input-form";

    // Create a textarea for multi-line input
    const textarea = document.createElement("textarea");
    textarea.id = "text-input";
    textarea.placeholder = "Enter text here";
    textarea.rows = 4; // Adjust for desired size
    textarea.cols = 30; // Adjust for desired size
    textarea.classList.add("mui-textarea");

    const button = document.createElement("button");
    button.type = "submit";
    button.innerText = "Submit";
    button.classList.add("mui-btn");

    form.appendChild(textarea);
    form.appendChild(button);
    formContainer.appendChild(form);

    map.getContainer().appendChild(formContainer);

    form.onsubmit = function (event) {
        event.preventDefault();
        const text = textarea.value.trim();
        if (text) {
            state.point.properties.text = text;
            // Clean up the form after submission
            map.getContainer().removeChild(formContainer);
        }
    };

    this.map.fire(Constants.events.CREATE, {
        features: [state.point.toGeoJSON()],
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, { featureIds: [state.point.id] });
};

DrawText.onStop = function(state) {
    this.activateUIButton();
    if (!state.point.getCoordinate().length) {
        this.deleteFeature([state.point.id], { silent: true });
    }
};

DrawText.toDisplayFeatures = function(state, geojson, display) {
    // Never render the point we're drawing
    const isActivePoint = geojson.properties.id === state.point.id;
    geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActivePoint) return display(geojson);
};

DrawText.onTrash = DrawText.stopDrawingAndRemove;

DrawText.onKeyUp = function(state, e) {
    if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
        return this.stopDrawingAndRemove(state, e);
    }
};

export default DrawText;
