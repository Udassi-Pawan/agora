/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

// database connection
const db = require('../db/connection');

// import models
const Activity = require('../model/activity');

// any cross services required



/**
 * Get an active activity by id
 * @param {Integer} activityId 
 * @returns activity
 */
exports.getActiveActivityById = async function(activityId) {
    let text = "SELECT * FROM activities WHERE active = $1 AND id = $2";
    let values = [ true, activityId ];
    try {
        let activity = "";
         
        let res = await db.query(text, values);
        if(res.rowCount > 0) {
            activity = Activity.ormActivity(res.rows[0]);
                  
        }
        return activity;
        
    }
    catch(e) {
        console.log(e.stack)
    }
}


/**
 * Saves a activity to the database, creates a new record if no id is assigned, updates existing record if there is an id.
 * @param {Activity} activity 
 * @returns Activity object with id 
 */
 exports.saveActivity = async function(activity) {
    // check to see if an id exists - insert / update check
    if(activity) {

        if(activity.id > 0) {
            
            // update
            let text = "UPDATE activities SET activity_type = $1, activity_name = $2, activity_description = $3, activity_html=$4, is_required=$5, active = $6, WHERE id = $7;";
            let values = [ activity.activityType, activity.activityName, activity.activityDescription, activity.activityHtml, activity.isRequired, activity.active, activity.id ];
    
            try {
                let res = await db.query(text, values);
            }
            catch(e) {
                console.log("[ERR]: Error updating activity - " + e);
                return false;
            }
            
        }
        else {
            
            // insert
            let text = "INSERT INTO activities (activity_type, activity_name, activity_description, activity_html, is_required, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;";
            let values = [ activity.activityType, activity.activityName, activity.activityDescription, activity.activityHtml, activity.isRequired, activity.active ];

            try {
                let res = await db.query(text, values);
                console.log("res 2 : " + res + " row count : " + res.rowCount);
                if(res.rowCount > 0) {
                    console.log("about to append: " + res.rows[0].id)
                    activity.id = res.rows[0].id;
                }
                console.log("activity id : " + activity.id);
                
            }
            catch(e) {
                console.log("[ERR]: Error inserting activity - " + e);
                return false;
            }
        }
        console.log("service departing id : " + JSON.stringify(activity));
        return activity;
    }
    else {
        return false;
    }
}