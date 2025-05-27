
<script>
  let { person } = $props();
  import Avatar from "$lib/components/global/avatar.svelte";
</script>

<div class="card">
    <Avatar size="large" image={person.image} username={person.username} colour={person.colour}/>
    <div class="content">
        <div class="header">
            <div class="text-element"><span class="body-accent">{person.username}</span></div>
            <div class="text-element"><span class="body">scaling: {person.scalingFactor}</span></div>
        </div>
        <div class="content-body">
            <div class="text-element"><span class="body">{person.numCommits} commits</span></div>
            <div class="text-element"><span class="body">{person.totalLinesOfCode} lines of code</span></div>
            <div class="text-element"><span class="body">{person.linesPerCommit} lines/commit</span></div>
            <div class="text-element"><span class="body">{person.commitsPerDay} commit/day</span></div>
            <div class="text-element"><span class="body-accent additions">{person.totalAdditions}++ additions</span></div>
            <div class="text-element"><span class="body-accent deletions">{person.totalDeletions}-- deletions</span></div>
        </div>
    </div>
</div>

<style>
.additions {
    color: var(--wonderland--ff748b)
}

.deletions {
    color: var(--wonderland--00d498)
}

.text-element {
    justify-content: center;
    display: flex;
    flex-direction: column;
}

.header {
    align-self: stretch;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    display: flex;
    gap: 0rem
}

.content-body {
    align-self: stretch;
    justify-content: flex-start;
    align-items: center;
    gap: 0px 0.635rem;
    display: inline-flex;
    flex-wrap: wrap;
    align-content: center;
}

.content {
    flex: 1 1 0;
    align-self: stretch;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0.625rem;
    display: inline-flex;
}

.card {
        background: var(--Fill-Tint-00);
        border-radius: 8px;
        padding: 2rem;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        text-align: center;
        color: var(--white, #fff);
        width: 373.33px;
        height: 153px;
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 1rem;
    }
</style>
