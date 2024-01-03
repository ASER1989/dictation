import React from "react";
import "./index.styl";
import { RiDeleteBinLine } from "react-icons/ri";

type Props = {
  onRemove: (words: string) => void;
  children: string;
};

export default function Words(props: Props) {
  const { children, onRemove } = props;

  const handleRemoveClick = () => {
    onRemove?.(children);
  };
  return (
    <div className="words">
      <RiDeleteBinLine onClick={handleRemoveClick} className="words-remove" />
      {children}
    </div>
  );
}
