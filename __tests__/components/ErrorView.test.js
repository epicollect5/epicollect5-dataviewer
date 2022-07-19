import React from 'react';
import { shallow, mount, render } from 'enzyme';
import ErrorView from 'components/ErrorView';


describe('(Component) ErrorView', () => {
    it('renders without exploding', () => {
        const wrapper = shallow(<ErrorView />);
        expect(wrapper).toHaveLength(1);
    });

    it('+++ display single error', () => {
        const errors = JSON.parse('[{"code":"ec5_11","title":"Project does not exist.","source":"middleware"}]');

        const wrapper = shallow(<ErrorView errors={errors} />);
        const h1 = wrapper.find('div#error-view h1');
        expect(h1.text()).toBe(errors[0].title);
    });

    it('+++ display multiple errors', () => {
        const errors = JSON.parse('[{"code":"ec5_11","title":"Project does not exist.","source":"middleware"},{"code":"ec5_91","title":"Sorry, you cannot perform this operation.","source":"middleware"}]');

        const wrapper = shallow(<ErrorView errors={errors} />);
        const h1 = wrapper.find('div#error-view h1');
        expect(h1).toHaveLength(2);
        h1.forEach((node, index) => {
            expect(node.text()).toBe(errors[index].title);
        });
    });
});
