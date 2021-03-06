import * as React from 'react';
import { findElement, findFocusable } from '../internal-types';
import { instance } from '../singleton';

export type FocusAreaProps = {
  children: React.ReactNode;
  focusIn?: HTMLElement | string;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * The ArcFocusArea acts as a virtual focus element which transfers focus
 * to child. Take, for example, a list of lists, like this:
 *
 * ```
 * Row A
 * ┌────────┐┌────────┐┌────────┐
 * └────────┘└────────┘└────────┘
 * Row B
 * ┌────────┐┌────────┐
 * └────────┘└────────┘
 * Row C
 * ┌────────┐┌────────┐┌────────┐
 * └────────┘└────────┘└────────┘
 * ```
 *
 * When focusing downwards from the first element in Row A (or, often, any
 * element from A) it's usually desirable to focus the first element in Row B
 * instead of focusing whatever happens to be geographically below that
 * element elsewhere on the page, such as the third item in Row C.
 *
 * This component allows you to wrap Row B in a virtual focus area, which
 * is detected by the focusing algorithm and can direct the focus to a
 * specified element -- the first box within the area, in this case.
 *
 * @example
 * <FocusArea>
 *   {myContent.map(content => <ContentElement data={content} />)}
 * </FocusArea>
 *
 * // You can focus a particular child, by passing a selector or HTMLElement.
 * <FocusArea focusIn=".target">
 *   {myContent.map(content => <ContentElement data={content} />)}
 * </FocusArea>
 */
export class FocusArea extends React.PureComponent<FocusAreaProps> {
  private containerRef = React.createRef<HTMLDivElement>();

  public componentDidMount() {
    const element = this.containerRef.current!;
    instance.getServices().stateContainer.add(this, {
      element,
      onIncoming: ev => {
        if (ev.next !== element) {
          return;
        }

        let target: HTMLElement | null = findElement(element, this.props.focusIn);
        if (!target && ev.focusContext) {
          target = ev.focusContext.find(element);
        }
        if (!target) {
          target = findFocusable(element);
        }

        ev.next = target || element;
      },
    });
  }

  public componentWillUnmount() {
    const services = instance.maybeGetServices();
    if (services && this.containerRef.current) {
      services.stateContainer.remove(this, this.containerRef.current);
    }
  }

  public render() {
    const { children, focusIn, ...htmlProps } = this.props;

    return (
      <div tabIndex={0} {...htmlProps} ref={this.containerRef}>
        {this.props.children}
      </div>
    );
  }
}

/**
 * HOC to create a FocusArea.
 */
export const ArcFocusArea = <P extends {} = {}>(
  Composed: React.ComponentType<P>,
  focusIn?: HTMLElement | string,
) => (props: P) => (
  <FocusArea focusIn={focusIn}>
    <Composed {...props} />
  </FocusArea>
);
