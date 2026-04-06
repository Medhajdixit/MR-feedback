/**
 * Loading Spinner Component
 */

export default function LoadingSpinner({ size = 'md', color = 'indigo' }) {
    const sizes = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };

    const colors = {
        indigo: 'border-indigo-600',
        blue: 'border-blue-600',
        green: 'border-green-600',
    };

    return (
        <div
            className={`animate-spin rounded-full border-b-2 ${sizes[size]} ${colors[color]}`}
        />
    );
}
