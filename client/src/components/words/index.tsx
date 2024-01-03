import React from 'react';
import './index.styl';
import { CiCircleRemove } from "react-icons/ci";

type Props = {
    onRemove: (words: string) => void;
    children: string;
};

export default function Words(props: Props) {
    const { children, onRemove } = props;

    const handleRemoveClick = () => {
        onRemove?.(children);
    }
    return (
        <div className='words'>
            <CiCircleRemove onClick={handleRemoveClick} className='words-remove' />
            {children}
        </div>
    )
}