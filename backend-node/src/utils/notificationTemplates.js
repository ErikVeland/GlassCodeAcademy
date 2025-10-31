/**
 * Notification Templates Utility
 * Provides standardized templates for different types of notifications
 */

/**
 * Welcome email template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function welcomeTemplate(data) {
  const { userName } = data;
  
  return {
    subject: 'Welcome to GlassCode Academy!',
    text: `Hi ${userName},

Welcome to GlassCode Academy! We're excited to have you join our learning community.

Get started by exploring our courses and begin your journey to mastering code.

Best regards,
The GlassCode Academy Team`,
    html: `<h1>Welcome to GlassCode Academy!</h1>
<p>Hi ${userName},</p>
<p>Welcome to GlassCode Academy! We're excited to have you join our learning community.</p>
<p>Get started by exploring our courses and begin your journey to mastering code.</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

/**
 * Lesson completion template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function lessonCompletionTemplate(data) {
  const { userName, lessonTitle, courseTitle, nextLessonTitle } = data;
  
  return {
    subject: `Lesson Completed: ${lessonTitle}`,
    text: `Hi ${userName},

Congratulations on completing "${lessonTitle}" in "${courseTitle}"!

${nextLessonTitle ? `Continue your learning journey with "${nextLessonTitle}".` : 'Check out what\'s next in your course.'}

Keep up the great work!

Best regards,
The GlassCode Academy Team`,
    html: `<h1>Lesson Completed!</h1>
<p>Hi ${userName},</p>
<p>Congratulations on completing <strong>"${lessonTitle}"</strong> in <strong>"${courseTitle}"</strong>!</p>
${nextLessonTitle ? `<p>Continue your learning journey with <strong>"${nextLessonTitle}"</strong>.</p>` : '<p>Check out what\'s next in your course.</p>'}
<p>Keep up the great work!</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

/**
 * Quiz result template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function quizResultTemplate(data) {
  const { userName, quizTitle, score, passed, courseTitle } = data;
  
  const resultText = passed ? 'passed' : 'did not pass';
  const encouragement = passed 
    ? 'Great job! Keep up the excellent work.' 
    : 'Don\'t worry, you can review the material and try again.';
  
  return {
    subject: `Quiz Result: ${quizTitle}`,
    text: `Hi ${userName},

You ${resultText} the quiz "${quizTitle}" in "${courseTitle}" with a score of ${score}%.

${encouragement}

View your full results in your dashboard.

Best regards,
The GlassCode Academy Team`,
    html: `<h1>Quiz Result</h1>
<p>Hi ${userName},</p>
<p>You <strong>${resultText}</strong> the quiz <strong>"${quizTitle}"</strong> in <strong>"${courseTitle}"</strong> with a score of <strong>${score}%</strong>.</p>
<p>${encouragement}</p>
<p>View your full results in your dashboard.</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

/**
 * New course announcement template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function newCourseTemplate(data) {
  const { userName, courseTitle, courseDescription } = data;
  
  return {
    subject: `New Course Available: ${courseTitle}`,
    text: `Hi ${userName},

We're excited to announce a new course: "${courseTitle}"!

${courseDescription}

Enroll now and start learning today.

Best regards,
The GlassCode Academy Team`,
    html: `<h1>New Course Available!</h1>
<p>Hi ${userName},</p>
<p>We're excited to announce a new course: <strong>"${courseTitle}"</strong>!</p>
<p>${courseDescription}</p>
<p><a href="/courses">Enroll now</a> and start learning today.</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

/**
 * Certificate earned template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function certificateEarnedTemplate(data) {
  const { userName, courseTitle, certificateId } = data;
  
  return {
    subject: `Certificate Earned: ${courseTitle}`,
    text: `Hi ${userName},

Congratulations! You've earned a certificate for completing "${courseTitle}".

View and download your certificate from your dashboard.

Congratulations on your achievement!

Best regards,
The GlassCode Academy Team`,
    html: `<h1>Certificate Earned!</h1>
<p>Hi ${userName},</p>
<p>Congratulations! You've earned a certificate for completing <strong>"${courseTitle}"</strong>.</p>
<p><a href="/dashboard/certificates/${certificateId}">View and download your certificate</a> from your dashboard.</p>
<p>Congratulations on your achievement!</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

/**
 * Forum post reply template
 * @param {Object} data - Template data
 * @returns {Object} Formatted notification data
 */
function forumReplyTemplate(data) {
  const { userName, postTitle, replierName, replyContent } = data;
  
  return {
    subject: `New Reply to Your Post: ${postTitle}`,
    text: `Hi ${userName},

${replierName} replied to your post "${postTitle}":

"${replyContent}"

View the full discussion in the forum.

Best regards,
The GlassCode Academy Team`,
    html: `<h1>New Reply to Your Post</h1>
<p>Hi ${userName},</p>
<p><strong>${replierName}</strong> replied to your post <strong>"${postTitle}"</strong>:</p>
<blockquote>"${replyContent}"</blockquote>
<p><a href="/forum/posts">View the full discussion</a> in the forum.</p>
<p>Best regards,<br/>
The GlassCode Academy Team</p>`
  };
}

module.exports = {
  welcomeTemplate,
  lessonCompletionTemplate,
  quizResultTemplate,
  newCourseTemplate,
  certificateEarnedTemplate,
  forumReplyTemplate,
};