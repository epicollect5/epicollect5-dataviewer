import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';
import reducers from 'reducers';
import FilterEntriesControls  from 'containers/FilterEntriesControls';

//mapStateToProps reads the project slug, the pagination and the project stats,
//so the store needs all three
const store = createStore(reducers, {
    projectReducer: {
        projectDefinition: {
            project: {
                slug: 'test-project'
            }
        }
    },
    tableReducer: {
        pagination: {
            newest: '',
            oldest: ''
        }
    },
    drawerReducer: {
        projectStats: {
            form_counts: {}
        }
    }
});

const wrapper = shallow(<FilterEntriesControls />, { context: { store } }).dive();

describe('(Container) FilterEntriesControls', () => {
    it('renders without exploding', () => {
        expect(wrapper).toHaveLength(1);
    });
});


// describe('just a test', () => {
//     it('should work', () => {
//         expect(true).toBe(true);
//     });
// });
