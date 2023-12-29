import * as CommonSelectors from '../lib/common_selectors';
import * as Constants from '../constants';

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const DrawText = {
    onSetup(opts) {
        const properties = (opts && opts.properties) || {}
        const point = this.newFeature({
            type: Constants.geojsonTypes.FEATURE,
            properties: {...properties},
            geometry: {
                type: Constants.geojsonTypes.POINT,
                coordinates: []
            }
        });

        this.addFeature(point);
        this.clearSelectedFeatures();
        this.updateUIClasses({mouse: Constants.cursors.ADD});
        this.activateUIButton(Constants.types.POINT);
        this.setActionableState({trash: true});

        // Initialize isInteractionAllowed to true to allow the first click
        return {
            point,
            isInteractionAllowed: document.getElementById("mapbox-gl-draw-text-form-container") === null
        };
    },

    onTap(state, e) {
        this.onClick(state, e); // Redirect tap event to the onClick handler
    },

    onClick(state, e) {
        console.log(state.isInteractionAllowed)
        if (!state.isInteractionAllowed) {
            return; // Do nothing if interaction isn't allowed
        }

        state.isInteractionAllowed = false; // Prevent new interactions until this one is complete
        const map = this.map;
        this.updateUIClasses({mouse: Constants.cursors.MOVE});
        state.point.updateCoordinate('', e.lngLat.lng, e.lngLat.lat);

        // Remove any existing form container
        const existingContainer = document.getElementById("mapbox-gl-draw-text-form-container");
        if (existingContainer) {
            existingContainer.remove();
        }

        // Create and style the form container
        const pixels = map.project(e.lngLat);
        const formContainer = document.createElement("div");
        formContainer.id = "mapbox-gl-draw-text-form-container";
        Object.assign(formContainer.style, {
            position: "absolute",
            left: `${pixels.x}px`,
            top: `${pixels.y}px`,
            zIndex: "10",
            display: "block"
        });

        // Create form elements: input and submit button
        const form = document.createElement("form");
        form.id = "text-input-form";
        const input = document.createElement("input");
        input.type = "text";
        input.id = "text-input";
        input.placeholder = "Enter text here";
        input.classList.add("mui-text-field");
        const button = document.createElement("button");
        button.type = "submit";
        button.innerText = "Submit";
        button.classList.add("mui-btn");

        // Append elements to form and then to map container
        form.appendChild(input);
        form.appendChild(button);
        formContainer.appendChild(form);
        map.getContainer().appendChild(formContainer);

        this.changeMode(Constants.modes.SIMPLE_SELECT, {featureIds: [state.point.id]});

        // Handle form submission
        form.onsubmit = (event) => {
            event.preventDefault();
            const text = input.value.trim();
            if (text) {
                state.point.properties.text = capitalizeFirstLetter(text); // Update point properties with text
                this.finishInteraction(state, formContainer); // Clean up and allow new interactions
                this.map.fire(Constants.events.CREATE, {
                    features: [state.point.toGeoJSON()]
                });
                this.changeMode(Constants.modes.SIMPLE_SELECT, {featureIds: [state.point.id]});
            }
        };
    },

    finishInteraction(state, formContainer) {
        // Remove the form container from the map
        this.map.getContainer().removeChild(formContainer);
        // Allow new interactions
        state.isInteractionAllowed = true;
        // Change mode or do additional cleanup as needed
    },

    stopDrawingAndRemove(state) {
        this.deleteFeature([state.point.id], {silent: true});
        this.changeMode(Constants.modes.SIMPLE_SELECT);
    },

    onKeyUp(state, e) {
        if (CommonSelectors.isEscapeKey(e) || CommonSelectors.isEnterKey(e)) {
            this.stopDrawingAndRemove(state, e);
        }
    },

    onStop(state) {
        this.activateUIButton();
        if (!state.point.getCoordinate().length) {
            this.deleteFeature([state.point.id], {silent: true});
        }
    },

    toDisplayFeatures(state, geojson, display) {
        const isActivePoint = geojson.properties.id === state.point.id;
        geojson.properties.active = (isActivePoint) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
        if (!isActivePoint) return display(geojson);
    },

    onTrash() {
        this.stopDrawingAndRemove(...arguments);
    },
};

export default DrawText;
