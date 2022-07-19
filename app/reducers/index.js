import { combineReducers } from 'redux';
import drawerReducer from 'reducers/drawerReducer';
import filterEntriesReducer from 'reducers/filterEntriesReducer';
import projectReducer from 'reducers/projectReducer';
import navigationReducer from 'reducers/navigationReducer';
import tableReducer from 'reducers/tableReducer';
import mapReducer from 'reducers/mapReducer';
import modalReducer from 'reducers/modalReducer';
import toastReducer from 'reducers/toastReducer';

const rootReducer = combineReducers({
    drawerReducer,
    filterEntriesReducer,
    projectReducer,
    navigationReducer,
    tableReducer,
    mapReducer,
    modalReducer,
    toastReducer
});

export default rootReducer;

