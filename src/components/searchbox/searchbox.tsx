import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdOutlineSearch, MdClose } from "react-icons/md";
import classes from "./searchbox.module.css";
import type { Session } from "@pkg/models/session";

const FONT_SIZE = 13;

export interface SearchBoxProps {
  session: Session;
  onClose?: () => void;
}

export function SearchBox(props: SearchBoxProps) {
  const { onClose, session } = props;
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClose?.();
    },
    [onClose]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const s = session.searchBoxFocus$.subscribe(() => {
      inputRef.current?.focus();
    });

    return () => s.unsubscribe();
  }, [session]);
  const [searchContent, setSearchContent] = useState("");
  const handleChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchContent(value);
      session.searchNext$.next(value);
    },
    [session]
  );
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);
  return (
    <form
      autoComplete="off"
      onSubmit={handleSubmit}
      className={classes.searchBox}
    >
      <MdOutlineSearch size={FONT_SIZE} className={classes.searchIcon} />
      <input
        placeholder="Search"
        ref={inputRef}
        style={{ fontSize: FONT_SIZE }}
        value={searchContent}
        type="search"
        autoComplete="off"
        onChange={handleChanged}
      />
      <MdClose
        className={classes.closeBtn}
        size={FONT_SIZE}
        onClick={handleClose}
      />
    </form>
  );
}
