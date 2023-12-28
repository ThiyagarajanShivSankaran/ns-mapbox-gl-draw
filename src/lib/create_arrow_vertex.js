import * as Constants from "../constants";
import bearing from "@turf/bearing";

export default function(parentId, currentVertexPosition, coordinates, selected) {
    const rotation = bearing(coordinates[currentVertexPosition - 1], coordinates[currentVertexPosition]);
    return {
        type: Constants.geojsonTypes.FEATURE,
        properties: {
            meta: 'arrowPosition',
            parent: parentId,
            bearing: rotation || 0,
            active: (selected) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE
        },
        geometry: {
            type: Constants.geojsonTypes.POINT,
            coordinates
        }
    };
}
