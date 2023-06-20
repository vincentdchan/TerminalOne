import React, {
  createRef,
  type ReactNode,
  type RefObject,
  Component,
  Ref,
} from "react";
import { createPortal } from "react-dom";
import { Subscription, fromEvent } from "rxjs";

export enum DropdownDirection {
  BottomWithLeftAligned = 1,
  BottomWithRightAligned = 2,
}

export interface ChildRenderOptions {
  ref: RefObject<any>;
  show: () => void;
}

const defaultWidth = 240;
const maxHeight = 240;
const minHeight = 120;

export interface DropdownOverlayOptions {
  style: React.CSSProperties;
  ref: Ref<HTMLElement>;
  close: () => void;
}

export interface DropdownProps {
  offsetY?: number;
  direction?: DropdownDirection;
  width?: number;
  overlay?: (overlayOptions: DropdownOverlayOptions) => ReactNode;
  children: (options: ChildRenderOptions) => ReactNode;
}

interface DropdownState {
  show: boolean;
  x: number;
  y: number;
  maxHeight: number;
}

export interface DropdownInput {
  rect: DOMRect;
  dropdownWidth: number;
  offsetY: number;
  direction: DropdownDirection;
}

export interface DropdownOutput {
  x: number;
  y: number;
  maxHeight: number;
}

function getXByDirection(input: DropdownInput): number {
  const x = input.rect.x;
  if (input.direction === DropdownDirection.BottomWithRightAligned) {
    return x + input.rect.width - input.dropdownWidth;
  }
  return x;
}

function computeMenuOnTop(input: DropdownInput): DropdownOutput {
  const x = getXByDirection(input);
  const { rect, offsetY } = input;
  const yBottom = rect.y - rect.height - offsetY;

  let height = maxHeight;
  let y = yBottom - height;
  if (y < 0) {
    y = 0;
    height = yBottom;
  }

  return { x, y, maxHeight: height };
}

export function computeDropdown(input: DropdownInput): DropdownOutput {
  const x = getXByDirection(input);
  const { rect, offsetY } = input;
  const y = rect.y + rect.height + offsetY;
  let height = maxHeight;
  if (y + height >= window.innerHeight) {
    height = window.innerHeight - y;
  }

  if (height < minHeight) {
    return computeMenuOnTop(input);
  }

  return { x, y, maxHeight };
}

class Dropdown extends Component<DropdownProps, DropdownState> {
  #overlayRef: RefObject<HTMLElement> = createRef();
  #childRef: RefObject<HTMLElement> = createRef();
  #subscriptions: Subscription[] = [];

  constructor(props: DropdownProps) {
    super(props);
    this.state = {
      show: false,
      x: 0,
      y: 0,
      maxHeight: maxHeight,
    };
  }

  override componentDidMount(): void {
    const click$ = fromEvent(window, "click");
    this.#subscriptions.push(
      click$.subscribe((event) => {
        if (!this.state.show) {
          return;
        }
        const target = event.target as HTMLElement;
        if (
          !this.#childRef.current?.contains(target) &&
          !this.#overlayRef.current?.contains(target)
        ) {
          this.setState({ show: false });
        }
      })
    );
  }

  override componentWillUnmount(): void {
    this.#subscriptions.forEach((s) => s.unsubscribe());
  }

  #show = () => {
    const rect = this.#childRef.current!.getBoundingClientRect();
    const offsetY = this.props.offsetY ?? 8;
    const dropdownWidth = this.props.width ?? defaultWidth;

    const output = computeDropdown({
      rect,
      offsetY,
      direction:
        this.props.direction ?? DropdownDirection.BottomWithLeftAligned,
      dropdownWidth,
    });

    this.setState({
      show: true,
      x: output.x,
      y: output.y,
      maxHeight: output.maxHeight,
    });
  };

  override render() {
    const { children, overlay, width } = this.props;
    const { show, x, y, maxHeight } = this.state;
    return (
      <>
        {children({ ref: this.#childRef, show: this.#show })}
        {show &&
          createPortal(
            overlay?.({
              style: {
                position: "fixed",
                width: width ?? defaultWidth,
                left: x,
                top: y,
                maxHeight: maxHeight,
              },
              ref: this.#overlayRef,
              close: () => this.setState({ show: false }),
            }),
            document.getElementById("t1-dropdown")!
          )}
      </>
    );
  }
}

export default Dropdown;
