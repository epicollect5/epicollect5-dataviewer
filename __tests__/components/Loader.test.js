import React from 'react';
import { shallow, mount, render } from 'enzyme';
import Loader from 'components/Loader';


describe('(Component) Loader', () => {
    it('renders without exploding', () => {
        const wrapper = shallow(<Loader />);
        expect(wrapper).toHaveLength(1);
    });
});
