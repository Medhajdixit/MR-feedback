/**
 * Badge Component
 * Display achievement badges
 */

export default function Badge({ icon, name, description, earned = false }) {
    return (
        <div
            className={`p-4 rounded-lg border-2 text-center transition-all ${earned
                    ? 'border-indigo-500 bg-indigo-50 scale-100'
                    : 'border-gray-200 bg-gray-50 opacity-50 grayscale'
                }`}
        >
            <div className="text-4xl mb-2">{icon}</div>
            <div className="font-semibold text-sm mb-1">{name}</div>
            <div className="text-xs text-gray-600">{description}</div>
            {earned && (
                <div className="mt-2 text-xs text-indigo-600 font-semibold">✓ Earned</div>
            )}
        </div>
    );
}
