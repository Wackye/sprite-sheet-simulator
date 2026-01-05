import { useTranslation } from 'react-i18next';
import kvImage from '../assets/KV.png';

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="w-full py-6 text-center text-sm text-gray-600 bg-white border-t border-gray-100">
            <p>
                {t('footer.made_by')}{' '}
                <a
                    href="https://goldentseng.com/about/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1957BC] hover:text-[#243179] transition-colors underline decoration-blue-200 hover:decoration-[#243179] underline-offset-2"
                >
                    Golden
                </a>
            </p>
            <div className="w-1/2 mx-auto my-6 flex justify-center">
                <img src={kvImage} alt="KV" className="w-1/2 h-auto object-cover" />
            </div>
        </footer >
    )
}
