import { M3eAppBar } from "@m3e/react/app-bar";
import { M3eIconButton } from "@m3e/react/icon-button";
import { M3eIcon } from "@m3e/react/icon";
import { useEffect, useRef, useState } from "react";
import { M3eDrawerContainer, M3eDrawerToggle } from "@m3e/react/drawer-container";
import { M3eNavMenu, M3eNavMenuItemGroup, M3eNavMenuItem } from "@m3e/react/nav-menu";
import { M3eHeading } from "@m3e/react/heading";
import { M3eDivider } from "@m3e/react/divider";
import { M3eSearchBar } from "@m3e/react/search";
import { M3eCard } from "@m3e/react/card";
import { M3eButtonGroup } from "@m3e/react/button-group";
import { M3eAssistChip } from "@m3e/react/chips";
import { M3eTooltip } from "@m3e/react/tooltip";

export function App() {
    const [isZh, setLang] = useState(false);
    const appBarRef = useRef<any>(null);
    const drawerRef = useRef<any>(null);

    useEffect(() => {
        const appBar = appBarRef.current;
        const drawer = drawerRef.current;
        if (!appBar || !drawer) return;
        const content = drawer.shadowRoot?.querySelector(".content") as HTMLElement | null;
        if (content && typeof appBar.attach === "function") {
            appBar.attach(content);
        }
    }, []);

    useEffect(()=>{
        if(localStorage.getItem('flc-lang')){
            setLang(localStorage.getItem('flc-lang') === 'zh');
            return;
        };
        setLang(navigator.language.includes('zh'));
    },[]);

    return <M3eDrawerContainer ref={drawerRef} start-mode="auto" className="h-full">
        <div slot="start" id="toc-drawer">
            <M3eNavMenu>
                <M3eNavMenuItemGroup>
                    <M3eHeading slot="label" variant="label">{isZh ? '目录' : 'Table of Contents'}</M3eHeading>
                    <M3eNavMenuItem><span slot="label">Name</span></M3eNavMenuItem>
                    {/* TODO: 目录跳转 */}
                </M3eNavMenuItemGroup>
            </M3eNavMenu>
        </div>

        <M3eAppBar ref={appBarRef} size="large" scroll-behavior="compress" style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <M3eIconButton slot="leading" toggle>
                <M3eIcon name="left_panel_open"/>
                <M3eIcon slot="selected" name="left_panel_close" />
                <M3eDrawerToggle htmlFor="toc-drawer"/>
            </M3eIconButton>
            <span slot="title">Free-LLM-Collection Web</span>
            <span slot="subtitle">{isZh ? '免费大模型API合集' : 'Free GPT-like Language Model(LLM) API Collection'}</span>
            <M3eIconButton slot="trailing" onClick={()=>{
                setLang(!isZh);
                localStorage.setItem('flc-lang', isZh ? 'en' : 'zh');
            }}>
                <M3eIcon name="translate" />
            </M3eIconButton>
            <M3eIconButton slot="trailing" href="https://github.com/for-the-zero/Free-LLM-Collection" target="_blank">
                <M3eIcon name="pull_request" />
            </M3eIconButton>
        </M3eAppBar>

        <div className="p-4 flex flex-col gap-4">
            <div className="whitespace-pre-wrap">
                {isZh 
                    ? [
                        '这是一个由',
                        <a href="https://ftz.is-a.dev/" target="_blank">for_the_zero</a>,
                        '收集的免费大模型API合集，旨在寻找可以免费使用大模型API的渠道\n',
                        '入选要求为：\n',
                        '1. 长期可免费使用\n',
                        '2. 非一次性额度\n',
                        '3. 速率限制可刷新\n',
                        '4. 无需信用卡等验证\n',
                        '5. 无需AFF\n',
                        '可通过Issue/PR进行投稿，允许个人公益站/中转站投稿'
                    ]
                    : [
                        'This is a collection of free GPT-like Language Model(LLM) API, aiming to find a way to use free GPT-like LLM API.\n',
                        'Requirements:\n',
                        '1. Long-term free use\n',
                        '2. Non-one-time quota\n',
                        '3. Rate limit refreshable\n',
                        '4. No need for credit card verification\n',
                        '5. No need for AFF\n',
                        'You can submit your contribution via Issue/PR, allowing for personal non-profit sites/intermediaries to submit.'
                    ]}
            </div>

            <M3eDivider/>

            <M3eSearchBar clearable>
                <M3eIcon name="search" slot="leading" />
                <input slot="input" placeholder="Search..." />
            </M3eSearchBar>

            <div className="columns-1 sm:columns-2 gap-4 *:mb-4 *:break-inside-avoid *:block">
                <M3eCard>
                    <div className="p-4 gap-1">
                        <div className="flex flex-row justify-between gap-3 items-center">
                            <div className="flex flex-col justify-between min-w-0 flex-1">
                                <M3eHeading variant="headline" size="medium">Provider Name</M3eHeading>
                                <M3eHeading variant="label" size="large" className="truncate text-(--md-sys-color-on-surface-variant)">https://api.example.com/v1</M3eHeading>
                                <M3eHeading variant="label" size="medium" className="truncate text-(--md-sys-color-outline)">ex-tip</M3eHeading> {/*可以没有*/}
                            </div>
                            <M3eButtonGroup>
                                <M3eIconButton href="" target="_blank" variant="tonal" id={"open-1"}>
                                    <M3eIcon name="open_in_new" />
                                </M3eIconButton>
                                <M3eTooltip htmlFor={"open-1"}>{isZh ? '打开网站' : 'Open Website'}</M3eTooltip>
                                <M3eIconButton onClick={()=>{/*复制*/}} id={"copy-1"}>
                                    <M3eIcon name="content_copy" />
                                </M3eIconButton>
                                <M3eTooltip htmlFor={"copy-1"}>BaseURL</M3eTooltip>
                            </M3eButtonGroup>
                        </div>
                        <M3eDivider className="mt-2 mb-2"/>
                        <div className="flex flex-col gap-1">
                            <M3eHeading variant="label" size="large" className="truncate text-(--md-sys-color-on-surface-variant)">
                                {`非共享限制: RPM 10 | RPD 100 | ex-limits`}
                            </M3eHeading>
                            <div>
                                <M3eAssistChip className="mr-1 mb-1" onClick={()=>{/*复制*/}}><M3eIcon slot="icon" name="neurology"></M3eIcon>model id</M3eAssistChip>
                                <M3eAssistChip className="mr-1 mb-1" onClick={()=>{/*复制*/}}><M3eIcon slot="icon" name="neurology"></M3eIcon>model id</M3eAssistChip>
                                <M3eAssistChip className="mr-1 mb-1" onClick={()=>{/*复制*/}}><M3eIcon slot="icon" name="neurology"></M3eIcon>model id</M3eAssistChip>
                            </div>
                        </div>
                        <M3eDivider className="mt-2 mb-2"/>
                        <div className="flex flex-col gap-1">
                            <M3eHeading variant="label" size="large" className="truncate text-(--md-sys-color-on-surface-variant)">
                                {`共享限制: RPM 10 | RPD 100 | ex-limits`}
                            </M3eHeading>
                            <div>
                                <M3eAssistChip className="mr-1 mb-1" onClick={()=>{/*复制*/}}><M3eIcon slot="icon" name="neurology"></M3eIcon>model id</M3eAssistChip>
                                <M3eAssistChip className="mr-1 mb-1">...</M3eAssistChip> {/*ellipsis*/}
                            </div>
                        </div>
                    </div>
                </M3eCard>
            </div>
            {/* TODO:生成卡片 */}
        </div>
    </M3eDrawerContainer>;
};

// key modelgroups
// limits models

export default App;
