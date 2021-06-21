import React from 'react';
import Recording from './index'
import { render } from '@testing-library/react'

const stream = {
    key: "lsdkjflds",
    stream: "sdkfjsdf08sdf",
    name: "2021-06-18 07:37:46"
}

it('renders without crashing', () => {
    const div = document.createElement('div');
    render(<Recording stream={stream.stream} name={stream.name} key={stream.key} />, div);
})
