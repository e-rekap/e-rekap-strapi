/**
 * Route custom My Job List + Take Over Job.
*/

const assignee = (rejectedAction: string) => ({
  name: 'global::is-assignee',
  config: { rejectedAction },
});

const onShift = (rejectedAction: string) => ({
  name: 'global::is-on-shift',
  config: { rejectedAction },
});

export default {
  routes: [
    {
      method: 'GET',
      path: '/my-job',
      handler: 'job-workflow.me',
    },
    {
      method: 'GET',
      path: '/my-job/pending',
      handler: 'job-workflow.pending',
      config: { policies: [onShift('job.pending_rejected')] },
    },
    {
      method: 'POST',
      path: '/my-job/:id/start',
      handler: 'job-workflow.start',
      config: { policies: [assignee('job.transition_rejected')] },
    },
    {
      method: 'POST',
      path: '/my-job/:id/notes',
      handler: 'job-workflow.addNote',
      config: { policies: [assignee('job.transition_rejected')] },
    },
    {
      method: 'POST',
      path: '/my-job/:id/complete',
      handler: 'job-workflow.complete',
      config: { policies: [assignee('job.transition_rejected')] },
    },
    {
      method: 'POST',
      path: '/my-job/:id/take-over',
      handler: 'job-workflow.takeOver',
      config: { policies: [onShift('job.take_over_rejected')] },
    },
  ],
};
