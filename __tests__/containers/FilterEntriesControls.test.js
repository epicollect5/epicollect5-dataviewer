import React from 'react';
import { shallow, mount, render } from 'enzyme';
import FilterEntriesControls  from 'containers/FilterEntriesControls';


const wrapper = shallow(<FilterEntriesControls />).dive();

describe('(Container) FilterEntriesControls', () => {
    it('renders without exploding', () => {
        expect(wrapper).to.have.length(1);
    });
});


// describe('just a test', () => {
//     it('should work', () => {
//         expect(true).toBe(true);
//     });
// });
