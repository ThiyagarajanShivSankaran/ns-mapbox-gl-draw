import draw_line_string from './draw_line_string';
import * as Constants from "../constants";
import createVertex from "../lib/create_vertex";
import create_additional_vertex from "../lib/create_additional_vertex";

const DrawLineArrow = { ...draw_line_string };
DrawLineArrow.onKeyUp = function (state, e) {
    if (e.keyCode === 13) { // Enter key ends the line
        this.changeMode('simple_select');
    }
};

DrawLineArrow.toDisplayFeatures = function (state, geojson, display) {
    const isActiveLine = geojson.properties.id === state.line.id;
    geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
    if (!isActiveLine) return display(geojson);
    // Only render the line if it has at least one real coordinate
    if (geojson.geometry.coordinates.length < 2) return;
    geojson.properties.meta = Constants.meta.FEATURE;
    display(createVertex(
        state.line.id,
        geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
        `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
        false
    ));

    display(geojson);
    const { coordinates } = geojson.geometry;
    display(create_additional_vertex(
        state.line.id,
        state.currentVertexPosition,
        coordinates,
        false
    ));
};

export default DrawLineArrow;
