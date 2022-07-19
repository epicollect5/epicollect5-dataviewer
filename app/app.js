import React from 'react';
import ReactDOM from 'react-dom';
import Main from 'containers/Main';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducers from 'reducers';
import promiseMiddleware from 'redux-promise-middleware';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import helpers from 'utils/helpers';
import localstorage from 'utils/localstorage';

let createStoreWithMiddleware;

//only use redux-logger for debugging
if (process.env.NODE_ENV === 'production') {
    createStoreWithMiddleware = applyMiddleware(
        promiseMiddleware(),
        thunk
    )(createStore);
} else {
    createStoreWithMiddleware = applyMiddleware(
        promiseMiddleware(),
        thunk,
        logger()
    )(createStore);
}

const href = window.location.href;
const shouldRestore = helpers.getParameterByName('restore', href);
const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

if (shouldRestoreParams) {
    //start as fresh with default state
    ReactDOM.render(
        <Provider
            //restore map reducer previous state
            store={createStoreWithMiddleware(reducers, {
                mapReducer: {
                    isFetchingEntry: false,
                    isRejectedEntry: false,
                    entriesLocations: [],
                    filteredEntries: [],
                    pagination: null,
                    links: null,
                    isFetchingPage: false,
                    selectedEntry: null,
                    selectedDistributionQuestion: shouldRestoreParams.selectedDistributionQuestion,
                    selectedLocationQuestion: shouldRestoreParams.selectedLocationQuestion,
                    pieChartParams: shouldRestoreParams.pieChartParams,
                    pieChartLegend: shouldRestoreParams.pieChartLegend,
                    progressBarIsVisible: false,
                    progressBarMarkersProcessed: 0,
                    progressBarMarkersTotal: 0,
                    progressBarPercentage: 0,
                    closeAllPopups: false,
                    isUserFilteringClustersByDates: false,
                    sliderStartDate: null,
                    sliderEndDate: null,
                    sliderStartValue: null,
                    sliderEndValue: null
                }
            })}
        >
            <Main />
        </Provider>
        , document.getElementById('app'));
} else {
    //start as fresh with default state
    ReactDOM.render(
        <Provider
            store={createStoreWithMiddleware(reducers)}
        >
            <Main />
        </Provider>
        , document.getElementById('app'));
}
