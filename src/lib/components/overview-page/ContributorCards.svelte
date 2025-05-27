<script lang="ts">
    import Contributor from './contributor.svelte';
  import type { User } from '../../../data/dummyData';
  import {
    getUserTotalCommits,
    getUserTotalLinesOfCode,
    getUserLinesPerCommit,
    getUserCommitsPerDay,
    getUserTotalAdditions,
    getUserTotalDeletions,
    calculateScalingFactor,
    getAverageCommits,
    getSD
  } from '../../metrics';

  export let users: User[] = [];
  export let selectedBranch: string = 'all';

  // Filter users based on selected branch
  $: filteredUsers = selectedBranch === 'all' 
    ? users 
    : users.map(user => ({
        ...user,
        commits: user.commits.filter(commit => commit.branch === selectedBranch)
      })).filter(user => user.commits.length > 0);

  // Calculate metrics for each user
  $: commit_mean = getAverageCommits(filteredUsers);
  $: sd = getSD(filteredUsers);
  
  $: peopleWithMetrics = filteredUsers.map(user => {
    const numCommits = getUserTotalCommits(user);
    const scalingFactor = calculateScalingFactor(numCommits, commit_mean, sd);
    
    return {
      username: user.username,
      image: user.image,
      numCommits,
      totalLinesOfCode: getUserTotalLinesOfCode(user),
      linesPerCommit: getUserLinesPerCommit(user),
      commitsPerDay: getUserCommitsPerDay(user),
      totalAdditions: getUserTotalAdditions(user),
      totalDeletions: getUserTotalDeletions(user),
      scalingFactor: scalingFactor.toFixed(1)
    };
  });
</script>

<div class="grid">
  {#each peopleWithMetrics as person}
    <Contributor {person} />
  {/each}
</div>

<style>
      .grid {
      display: flex;
      flex-wrap: wrap;
      grid-template-columns: repeat(auto-fit, minmax(373.33px, 1fr));
      gap: 2rem; 
      justify-content: center;
      padding-top: 2rem;
      padding-bottom: 2rem;
      box-sizing: border-box;
      max-width: 100%;
    }
  
    @media (min-width: 960px) {
      .grid {
        grid-template-columns: repeat(3, 373.33px); 
        justify-content: center;
        gap: 1rem;
      }
    }
</style> 