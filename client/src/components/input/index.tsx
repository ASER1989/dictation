import './index.styl';
import React from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import classNames from 'classnames';

type InputType = string | number | undefined;
type Props<T extends unknown> = {
    value?: T;
    border?: boolean;
    placeholder?: string;
    onChange?: (newValue: T, value?: T, event?: Event) => void;
    onFocus?: (e: FocusEvent<HTMLInputElement, Element>) => void;
    onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
    light?: boolean;
};

export default function Input<T extends InputType>(
    {
        value,
        border = true,
        onChange,
        placeholder,
        onFocus,
        onKeyDown,
        light
    }: Props<T>) {
    const handleChange = (e: any) => {
        onChange?.(e.target.value, value, e);
    };

    const classes = classNames('input', {
        'border-none': !border,
        'height-light': light
    });

    return (
        <input
            className={classes}
            value={value}
            onChange={handleChange}
            onFocus={onFocus}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
        />
    );
}
