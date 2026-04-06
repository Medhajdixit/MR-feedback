/**
 * Reusable Card Component
 */

export default function Card({ children, className = '', hover = false }) {
    return (
        <div
            className={`bg-white rounded-lg shadow p-6 ${hover ? 'hover:shadow-lg transition-shadow' : ''
                } ${className}`}
        >
            {children}
        </div>
    );
}
