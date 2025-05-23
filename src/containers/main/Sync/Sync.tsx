import Progress from './components/Progress.tsx';
import AirdropInvite from './actions/AirdropInvite.tsx';
import AirdropLogin from './actions/AirdropLogin.tsx';
import ModeSelection from './actions/ModeSelection.tsx';
import { type } from '@tauri-apps/plugin-os';
import {
    ActionContent,
    Content,
    FooterContent,
    HeaderContent,
    HeaderGraphic,
    Heading,
    SubHeading,
    Wrapper,
} from './sync.styles.ts';
import { useTranslation } from 'react-i18next';

export default function Sync() {
    const { t } = useTranslation('setup-view');
    const isMac = type() === 'macos';
    const videoSrc = `/assets/video/coin_loader.${isMac ? 'mov' : 'webm'}`;
    return (
        <Wrapper>
            <Content>
                <HeaderContent>
                    <HeaderGraphic>
                        <video playsInline autoPlay loop muted controls={false}>
                            <source src={videoSrc} />
                        </video>
                    </HeaderGraphic>
                    <Heading>{t('sync.header')}</Heading>
                    <SubHeading>{t('sync.subheader')}</SubHeading>
                </HeaderContent>
                <ActionContent>
                    <AirdropLogin />
                    <ModeSelection />
                    <AirdropInvite />
                </ActionContent>
                <FooterContent>
                    <Progress />
                </FooterContent>
            </Content>
        </Wrapper>
    );
}
