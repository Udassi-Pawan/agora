
var express = require('express');
var router = express.Router();


// require services
const topicService = require('../../service/topicService');
const productService = require('../../service/productService');
const userService = require('../../service/userService');

// models
const TopicEnrollment = require('../../model/topicEnrollment');
const CompletedAssessment = require('../../model/completedAssessment');


const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
  }));
router.use(bodyParser.json());


// check that the user is logged in!
router.use(function (req, res, next) {
    if(!req.session.user) {
        if(req.query.redirect) {
            res.locals.redirect = req.query.redirect;
        }
        res.render('user-signup');
    }
    else {
        next();
    }
    
})







router.route('/override/:goalId/:topicId/:step')
.get(async (req, res) => {
    let goalId = req.params.goalId;
    let topicId = req.params.topicId;
    let stepOverride = req.params.step;

    let access = false;
    if(req.session.user) {
        // check that the user is enrolled!
        access = await topicService.verifyTopicAccess(req.session.user.id, topicId);

        if(access) {
            
            let currentTopic = null;
            let currentEnrollment = null;
            
            if(req.session.currentTopic && req.session.currentTopic.topicId == topicId) {
                // we have the current topic in the session already
                currentTopic = req.session.currentTopic.topic;
                currentEnrollment = req.session.currentTopic;
            }
            else {
                // there is no current topic or a new topic has been choosen
                currentEnrollment = await topicService.getActiveTopicEnrollmentsByUserAndTopicIdWithEverything(req.session.user.id, topicId, true);
                currentTopic = currentEnrollment.topic;

                // set the session
                req.session.currentTopic = topicEnrollment;
            }


            res.locals.topicEnrollment = currentEnrollment;
            res.locals.topic = currentTopic;

            // open the course
            res.render('community/topic', {goalId: req.session.goalId, hasAccess: access, currentStep: stepOverride});

        }
        else {
            // user does not have access send to community page
            res.redirect(303, '/community');
        }
    }

}
);

router.route('/update/:finishedStep')
.get(async (req, res) => {
    if(req.session.currentTopic) {
        let goalId = req.session.goalId;
        let topicId = req.session.currentTopic.topicId;
        let finishedStep = req.params.finishedStep;

        if(finishedStep == 1) {
            req.session.currentTopic.isIntroComplete =true;
            
            // save the data
            topicService.saveTopicEnrollmentWithEverything(req.session.currentTopic);

            // reroute
            res.redirect(303, '/community/topic/' + goalId + "/" + topicId + "?nextStep=2");
        }

        if(finishedStep == 2) {
            // create the completed assessment 
            let ca = CompletedAssessment.emptyCompletedAssessment();
            ca.userId = req.session.user.id;
            ca.assessmentId = req.session.currentTopic.topic.assessmentId;
            ca.prePost = 1; // pre
            ca.completedQuestions = null // TODO!!! must get the questions from the client side.

            req.session.currentTopic.preAssessment = ca;
            
            // save the data
            req.session.currentTopic = await topicService.saveTopicEnrollmentWithEverything(req.session.currentTopic);

            // reroute
            res.redirect(303, '/community/topic/' + goalId + "/" + topicId + "?nextStep=3");
        }

        if(finishedStep == 3) {
            

            // reroute
            res.redirect(303, '/community/topic/' + goalId + "/" + topicId + "?nextStep=4");
        }
    }
    else {
        // update not able to take place
        res.redirect(303, '/community')
    }
    

    
}
);

router.route('/:goalId/:topicId')
    .get(async (req, res) => {
        let goalId = req.params.goalId;
        let topicId = req.params.topicId;
        let nextStep = null;
        if(req.query.nextStep) {
            nextStep = req.query.nextStep;
        }
        let access = false;
        if(req.session.user) {
            // check that the user is enrolled!
            access = await topicService.verifyTopicAccess(req.session.user.id, topicId);
            if(!access) {
                // check to see if the user is a member and grant access if they are
                if(req.session.user.member) {
                    // save the enrollment for the user in the goal
                    let te = TopicEnrollment.emptyTopicEnrollment();
                    te.topicId = topicId;
                    te.userId = req.session.user.id;
                    await topicService.saveTopicEnrollment(te);
                    // reset the session
                    const rUser = await userService.setUserSession(req.session.user.email);

                    req.session.user = null;
                    req.session.user = rUser;
                    access = true;

                    // user has access set the page up with enrollment data
                    // user is not a member and does not currently have access setup page to allow them to enroll
                    // get the topic data
                    let topicEnrollment = await topicService.getActiveTopicEnrollmentsByUserAndTopicIdWithEverything(req.session.user.id, topicId, true);
                    //console.log("TopicEnrollment: " + JSON.stringify(topicEnrollment));

                    // get the current step
                    let currentStep = 1;


                    // determine the current step if different from Introduction
                    if(!topicEnrollment.isIntroComplete) {
                        currentStep = 1;
                    }
                    else if(topicEnrollment.preCompletedAssessmentId < 1) {
                        currentStep = 2;
                    }
                    else if(topicEnrollment.completedResources.length < topicEnrollment.topic.resources.length) {
                        currentStep = 3;
                    }
                    else if(topicEnrollment.completedActivityId < 1) {
                        currentStep = 4;
                    }
                    else if(topicEnrollment.postCompletedAssessmentId < 1) {
                        currentStep = 5;
                    }
                    else {
                        // topic complete?
                        console.log("triggered topic complete!");
                    }


                    // add the enrollment to the session
                    req.session.currentTopic = topicEnrollment;
                    res.locals.topicEnrollment = topicEnrollment;
                    res.locals.topic = topicEnrollment.topic;
                    req.session.goalId = goalId;

                    // open the course
                    res.render('community/topic', {goalId: goalId, hasAccess:access, currentStep: currentStep});

                }
                else {
                    // user is not a member and does not currently have access setup page to allow them to enroll
                    // get the topic data
                    
                    let topic = await topicService.getActiveTopicWithEverythingById(topicId);
                    //console.log("topic: " + JSON.stringify(topic) + " has access::::: " + access); 
                    // open the course

                    // add the enrollment to the session
                    req.session.currentTopic = null;
                    res.locals.topicEnrollment = null;
                    res.locals.topic = topic;
                    req.session.goalId = goalId;

                    res.render('community/topic', {goalId: goalId, hasAccess:access, currentStep:0});
                }

                
            }
            else {

                //console.log("compare: " + req.session.currentTopic + " && " + req.session.currentTopic.topicId +" == "+ topicId +" && "+ req.session.currentTopic.goalId +" == "+ goalId);
                if(req.session.currentTopic && req.session.currentTopic.topicId == topicId) {
                    // already have data (have to make sure it is up to date for this optimazation to work!)
                    
                    let topicEnrollment = req.session.currentTopic;
                    // get the current step
                    let currentStep = 1;
                    
                    // determine the current step if different from Introduction
                    if(!topicEnrollment.isIntroComplete) {
                        currentStep = 1;
                    }
                    else if(topicEnrollment.preCompletedAssessmentId < 1) {
                        currentStep = 2;
                    }
                    else if(topicEnrollment.completedResources.length < topicEnrollment.topic.resources.length) {
                        currentStep = 3;
                    }
                    else if(topicEnrollment.completedActivityId < 1) {
                        currentStep = 4;
                    }
                    else if(topicEnrollment.postCompletedAssessmentId < 1) {
                        currentStep = 5;
                    }
                    else {
                        // topic complete?
                        console.log("triggered topic complete!");
                    }

                    // add the enrollment to the session
                    req.session.currentTopic = topicEnrollment;
                    res.locals.topicEnrollment = topicEnrollment;
                    res.locals.topic = topicEnrollment.topic;
                    req.session.goalId = goalId;

                    // open the course
                    res.render('community/topic', {goalId: goalId, hasAccess:access, currentStep: currentStep});
                }
                else {

                    // user has access set the page up with enrollment data
                    // user is not a member and does not currently have access setup page to allow them to enroll
                    // get the topic data
                    let topicEnrollment = await topicService.getActiveTopicEnrollmentsByUserAndTopicIdWithEverything(req.session.user.id, topicId, true);
                    //console.log("TopicEnrollment: " + JSON.stringify(topicEnrollment));

                    // get the current step
                    let currentStep = 1;
                    
                    // determine the current step if different from Introduction
                    if(!topicEnrollment.isIntroComplete) {
                        currentStep = 1;
                    }
                    else if(topicEnrollment.preCompletedAssessmentId < 1) {
                        currentStep = 2;
                    }
                    else if(topicEnrollment.completedResources.length < topicEnrollment.topic.resources.length) {
                        currentStep = 3;
                    }
                    else if(topicEnrollment.completedActivityId < 1) {
                        currentStep = 4;
                    }
                    else if(topicEnrollment.postCompletedAssessmentId < 1) {
                        currentStep = 5;
                    }
                    else {
                        // topic complete?
                        console.log("triggered topic complete!");
                    }

                    // add the enrollment to the session
                    req.session.currentTopic = topicEnrollment;
                    res.locals.topicEnrollment = topicEnrollment;
                    res.locals.topic = topicEnrollment.topic;
                    req.session.goalId = goalId;

                    // open the course
                    res.render('community/topic', {goalId: goalId, hasAccess:access, currentStep: currentStep});
                }

            }
            
            
        }
        else {
            res.render('user-signup');
        }
    }
);



router.route('/enroll/:goalId/:topicId')
.get(async (req, res) => {
    let goalId = req.params.goalId;
    let topicId = req.params.topicId;
    if(req.session.user) {
        // see if the user has a token
        let user = req.session.user;
        // verify the user has access, first check membership:
        let access = await topicService.verifyTopicAccess(user.id, topicId);
        if(access) {
            // send them to the course
            res.redirect('/community/topic/' + topicId);
        }
        // User does not already have access try to enroll them if they have membership or a token
        let enrollment = await topicService.enrollUserWithMembershipOrToken(user, topicId);
        if(enrollment) { 

            // reset the session
            const rUser = await userService.setUserSession(req.session.user.email);

            req.session.user = null;
            req.session.user = rUser;

            // send them to the course
            res.redirect('/community/topic/' + goalId + "/" + topicId);
        }
        else {
            // they did not have membership or a token
            // get products to send to page (founders membership and tokens)
            const products = await productService.getAllActviteTokenAndMembershipProductsWithImages();

            // user does not currently have membership or tokens, redirct to join
            res.render('community/join', {products: products, user:user, message:"You did not have a membership or token to use!", message2:"Choose an option below to obtain access to additional topics"});
        }
    }
    else {
        res.render('user-signup');
    }
}
);



module.exports = router;