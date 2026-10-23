jest.mock('axios');

jest.mock('lodash', () => {
    const lodash = require.requireActual('lodash');
    return {
        ...lodash,
        //the title filter is debounced in the constructor, so run it straight away
        debounce: (fn) => {
            fn.cancel = () => {};
            return fn;
        }
    };
});

import React from 'react';
import { shallow } from 'enzyme';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import axios from 'axios';
import reducers from 'reducers';
import FilterEntriesControls  from 'containers/FilterEntriesControls';
import PARAMETERS from 'config/parameters';

//mapStateToProps reads the project slug, the pagination and the project stats,
//so the store needs all three
const store = createStore(reducers, {
    projectReducer: {
        projectDefinition: {
            project: {
                slug: 'test-project'
            }
        },
        projectExtra: {
            inputs: {},
            forms: {}
        }
    },
    tableReducer: {
        pagination: {
            newest: '',
            oldest: ''
        },
        //the filter handlers build the request url from the entries self link
        links: {
            self: 'https://five.epicollect.net/api/internal/entries/test-project?form_ref=form-1'
        }
    },
    drawerReducer: {
        projectStats: {
            form_counts: {}
        }
    }
}, applyMiddleware(thunk));

const wrapper = shallow(<FilterEntriesControls />, { context: { store } }).dive();

describe('(Container) FilterEntriesControls', () => {
    it('renders without exploding', () => {
        expect(wrapper).toHaveLength(1);
    });

    describe('filter handlers', () => {

        beforeEach(() => {
            //the table page fetch has a hardcoded timeout, so the timers are faked
            jest.useFakeTimers();
            axios.get.mockReturnValue(Promise.resolve({ data: 'a payload' }));
        });

        afterEach(() => {
            jest.useRealTimers();
            axios.get.mockReset();
        });

        it('+++ should filter by title', () => {
            wrapper.instance().updateFiltersByTitle('a title');

            const state = store.getState();
            expect(state.filterEntriesReducer.filterByTitle).toBe('a title');
            expect(state.filterEntriesReducer.isUserInteractingWithFilters).toBe(true);
        });

        it('+++ should filter by date', () => {
            wrapper.instance().updateFiltersByDate();

            const state = store.getState();
            expect(state.filterEntriesReducer.startDate).toBeTruthy();
            expect(state.filterEntriesReducer.endDate).toBeTruthy();
            expect(state.filterEntriesReducer.isUserInteractingWithFilters).toBe(true);
        });

        it('+++ should filter by order', () => {
            wrapper.instance().updateFiltersOrderBy();

            const state = store.getState();
            expect(state.filterEntriesReducer.selectedOrderBy).toBe(PARAMETERS.ORDER_BY.NEWEST);
            expect(state.filterEntriesReducer.sortBy).toBe('created_at');
            expect(state.filterEntriesReducer.sortOrder).toBe('DESC');
            expect(state.filterEntriesReducer.isUserInteractingWithFilters).toBe(true);
        });

        it('+++ should reset the filters', () => {
            wrapper.instance().updateFiltersByTitle('a title');
            expect(store.getState().filterEntriesReducer.filterByTitle).toBe('a title');

            wrapper.instance().handleResetFilters();

            const state = store.getState();
            expect(state.filterEntriesReducer.filterByTitle).toBe('');
            expect(state.filterEntriesReducer.sortBy).toBe(PARAMETERS.DEFAULT_ORDERING_COLUMN);
            expect(state.filterEntriesReducer.sortOrder).toBe(PARAMETERS.DEFAULT_ORDERING);
            expect(state.filterEntriesReducer.isUserInteractingWithFilters).toBe(false);
        });
    });
});
