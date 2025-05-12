<script lang="ts">
import Icon from "@iconify/svelte";
import ButtonTintedMedium from "./button-tinted-medium.svelte";
import ButtonPrimaryMedium from "./button-primary-medium.svelte";
</script>

<div class="popover">
    <div class="header">
        <!-- Icon can be broken into seperate component -->
        <div class="icon-header">
            <div data-property-1="tabler-icon-chart-line" class="large-2x">
                <Icon icon="tabler:sparkles" class="icon-large"/>
            </div>
        </div>
        <div class="heading">
            <div class="heading-text"><span class="heading-text-span">Heading</span></div>
        </div>
        <div class="icon-close">
            <div data-property-1="tabler-icon-x" class="medium-15x">
                <div class="vector-close"></div>
            </div>
        </div>
    </div>
    <div class="body">
        <div class="message-text"><span class="message-text-span">Sample body text here</span></div>
        <div data-type="Default" class="text-input-medium">
            <div class="text">
                <div class="placeholder"><span class="placeholder-span">Placeholder</span></div>
            </div>
        </div>
    </div>
    <!-- Same with buttons -->
    <div class="buttons">
        <ButtonTintedMedium label="cancel"/>
        <ButtonPrimaryMedium label="save"/>
        <ButtonTintedMedium icon="sparkles" label="hello" disabled={true}/>
        <ButtonPrimaryMedium icon="sparkles" label="hello" disabled={true}/>
    </div>
</div>

<style>
.vector-header {
    width: 16px;
    height: 13px;
    left: 4px;
    top: 6px;
    position: absolute;
    outline: 2px var(--Label-Primary) solid;
    outline-offset: -1px;
}

.heading-text-span {
    color: var(--Label-Primary);
    font-size: 22px;
    font-family: DM Mono;
    font-weight: 500;
    word-wrap: break-word;
    text-align: left;
}

.heading-text {
    flex: 1 1 0;
    justify-content: center;
    display: flex;
    flex-direction: column;
}

.vector-close {
    width: 9px;
    height: 9px;
    left: 4.50px;
    top: 4.50px;
    position: absolute;
    outline: 1.50px var(--Label-Primary) solid;
    outline-offset: -0.75px;
}

.message-text-span {
    color: var(--Label-Primary);
    font-size: 13px;
    font-family: DM Sans;
    font-weight: 400;
    word-wrap: break-word;
}

.message-text {
    justify-content: left;
    display: flex;
    flex-direction: column;
}

.placeholder-span {
    color: var(--Label-Secondary);
    font-size: 13px;
    font-family: DM Sans;
    font-weight: 400;
    word-wrap: break-word;
    text-align: left;
}

.placeholder {
    flex: 1 1 0;
}

.label-text-cancel {
    color: var(--Label-Primary);
    font-size: 13px;
    font-family: DM Sans;
    font-weight: 600;
    word-wrap: break-word;
}

.label {
    text-align: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
}

.label-text-save {
    color: var(--Background-Secondary);
    font-size: 13px;
    font-family: DM Sans;
    font-weight: 600;
    word-wrap: break-word;
}

.heading {
    flex: 1 1 0;
    align-self: stretch;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
    display: flex;
}

.text {
    flex: 1 1 0;
    height: 22px;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    display: flex;
}

.button-cancel {
    padding-left: 11px;
    padding-right: 11px;
    padding-top: 6px;
    padding-bottom: 6px;
    background: var(--Background-Secondary);
    border-radius: 8px;
    justify-content: center;
    align-items: center;
    gap: 5.50px;
    display: flex;
}

.button-save {
    padding-left: 11px;
    padding-right: 11px;
    padding-top: 6px;
    padding-bottom: 6px;
    background: #3B3B3B;
    border-radius: 8px;
    justify-content: center;
    align-items: center;
    gap: 5.50px;
    display: flex;
}

.large-2x {
    width: 24px;
    height: 24px;
    position: relative;
    overflow: hidden;
}

.medium-15x {
    width: 18px;
    height: 18px;
    position: relative;
    overflow: hidden;
}

.text-input-medium {
    align-self: stretch;
    height: 29px;
    padding-left: 16px;
    padding-right: 16px;
    background: var(--Background-Secondary);
    overflow: hidden;
    border-radius: 8px;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    display: inline-flex;
}

.buttons {
    align-self: stretch;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    display: inline-flex;
}

.icon-header {
    width: 29px;
    align-self: stretch;
    justify-content: center;
    align-items: center;
    gap: 10px;
    display: flex;
}

.icon-close {
    width: 22px;
    height: 22px;
    border-radius: 3px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    display: flex;
}

.body {
    align-self: stretch;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 16px;
    display: flex;
}

.header {
    align-self: stretch;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 8px;
    display: inline-flex;
}

.popover {
    width: 50%;
    height: 100%;
    padding: 32px;
    background: var(--Background-Tint);
    border-radius: 12px;
    outline: 1px var(--Label-Primary) solid;
    outline-offset: -1px;
    backdrop-filter: blur(16px);
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 24px;
    display: inline-flex;
}
</style>
