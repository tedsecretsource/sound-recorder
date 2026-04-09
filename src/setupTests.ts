import '@testing-library/jest-dom'
import 'vitest-canvas-mock'
import { vi } from 'vitest'

// Mock URL.createObjectURL globally
Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:https://localhost:3000/12345678-1234-1234-1234-123456789012')
})
