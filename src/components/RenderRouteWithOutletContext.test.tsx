import { render, screen } from '@testing-library/react'
import { useOutletContext } from 'react-router-dom'
import { RenderRouteWithOutletContext } from './RenderRouteWithOutletContext'

// Test component that uses the outlet context
const ContextConsumer = () => {
  const context = useOutletContext<{ value: string }>()
  return <div data-testid="context-value">{context.value}</div>
}

// Test component that uses a different context type
const NumberContextConsumer = () => {
  const context = useOutletContext<number>()
  return <div data-testid="number-context">{context}</div>
}

// Test component that uses array context
const ArrayContextConsumer = () => {
  const context = useOutletContext<string[]>()
  return (
    <ul data-testid="array-context">
      {context.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

describe('RenderRouteWithOutletContext component', () => {
  it('renders children', () => {
    render(
      <RenderRouteWithOutletContext context={{ value: 'test' }}>
        <div data-testid="child">Child Content</div>
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content')
  })

  it('provides context to children via useOutletContext', () => {
    render(
      <RenderRouteWithOutletContext context={{ value: 'passed-value' }}>
        <ContextConsumer />
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('context-value')).toHaveTextContent('passed-value')
  })

  it('works with different context types', () => {
    render(
      <RenderRouteWithOutletContext context={42}>
        <NumberContextConsumer />
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('number-context')).toHaveTextContent('42')
  })

  it('works with array context', () => {
    render(
      <RenderRouteWithOutletContext context={['item1', 'item2', 'item3']}>
        <ArrayContextConsumer />
      </RenderRouteWithOutletContext>
    )

    const list = screen.getByTestId('array-context')
    expect(list.children).toHaveLength(3)
    expect(list).toHaveTextContent('item1')
    expect(list).toHaveTextContent('item2')
    expect(list).toHaveTextContent('item3')
  })

  it('works with null context', () => {
    const NullContextConsumer = () => {
      const context = useOutletContext<null>()
      return <div data-testid="null-context">{context === null ? 'is null' : 'not null'}</div>
    }

    render(
      <RenderRouteWithOutletContext context={null}>
        <NullContextConsumer />
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('null-context')).toHaveTextContent('is null')
  })

  it('works with complex object context', () => {
    interface ComplexContext {
      user: { name: string; id: number }
      settings: { theme: string }
      items: string[]
    }

    const ComplexContextConsumer = () => {
      const context = useOutletContext<ComplexContext>()
      return (
        <div data-testid="complex-context">
          {context.user.name} - {context.settings.theme} - {context.items.length} items
        </div>
      )
    }

    const complexContext: ComplexContext = {
      user: { name: 'Test User', id: 123 },
      settings: { theme: 'dark' },
      items: ['a', 'b', 'c'],
    }

    render(
      <RenderRouteWithOutletContext context={complexContext}>
        <ComplexContextConsumer />
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('complex-context')).toHaveTextContent(
      'Test User - dark - 3 items'
    )
  })

  it('renders at root path', () => {
    // The component uses MemoryRouter which defaults to "/"
    // Children should render at the index route
    render(
      <RenderRouteWithOutletContext context="test">
        <div data-testid="rendered">Content</div>
      </RenderRouteWithOutletContext>
    )

    expect(screen.getByTestId('rendered')).toBeInTheDocument()
  })
})
