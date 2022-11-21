const discussion = require( "../model/discussion" );
const comment = require( "../model/comment" );
const db = require( "../db/connection" );

// Essentially acts as enabling a discussion
exports.createDiscussion = async ( type, id, discussion_text, userId ) => {

    // this is safe because we know the routes that call this function on use these two
    const parentTable = type === "workspace" ? "workspaces" : "topics";

    const text = `
        INSERT INTO discussions (
            parent_id,
            parent_type,
            discussion_text
        )
        SELECT parent.id, $1, $3
        FROM ${parentTable} parent
        WHERE parent.id = $2 AND parent.owned_by = $4;
    `;
    const values = [ type, id, userId, discussion_text ];
    
    try {
        
        let res = await db.query( text, values );

        if( res.rows.length === 0 ) {
            return "No discussion found";
        }

        return discussion.ormDiscussion( res.rows[0] );
        
    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }
};

exports.getDiscussion = async ( type, id, userId ) => {
    // make sure to include whether the user can see in the query
    const text = `
        SELECT * 
        FROM discussions 
        WHERE parent_type = $1 
        AND parent_id = $2 
        AND $3=$3;
    `;

    // TODO: Need to check if the user is allowed to see the discussion
    // Other teams should implement this function

    const values = [ type, id, userId ];

    try {
        
        let res = await db.query( text, values );

        if( res.rows.length === 0 ) {
            return false;
        }

        const disc = discussion.ormDiscussion( res.rows[0] );
        
        const comments = await this.getCommentsForDiscussion( id, type );

        if( comments ) {
            disc.comments = comments;
        }

        return disc;

    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }

};

exports.updateDiscussion = async ( type, id, userId, updatedDiscussion ) => {

    try {
        
        let existingDiscussion = await this.getDiscussion( type, id, userId );

        if( !existingDiscussion ) {
            return false;
        }

        // properties on existing will be overridden by the ones specified on updated (only text right now)
        const updated = {
            ...existingDiscussion, 
            discussion_text: updatedDiscussion.discussion_text
        };

        // TODO: include auth verification in this, userId must match the workspace or topic owner
        // Should rely on other teams to implement this function
        const text = `
            UPDATE discussions
            SET discussion_text = $3
            WHERE parent_type = $1
            AND parent_id = $2
        `;
        const values = [ type, id, updated.discussion_text ];

        await db.query( text, values );

        return updated;
        
    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }
};

exports.setCommentRating = async ( commentId, rating, userId ) =>  {
    try {
        const text  = `
            INSERT INTO discussion_comment_ratings(
                comment_id,
                user_id,
                rating
            ) 
            VALUES ($1, $3, $2)
            ON CONFLICT (comment_id, user_id)
            DO
                UPDATE SET rating = $2
        `;

        const values = [ commentId, rating, userId ];

        await db.query( text, values );

        return true;

    }
    catch ( e ) {
        console.error( e.stack );
        return false;
    }
};

exports.removeCommentRating = async ( commentId, userId ) => {
    try {
        const text  = `
            DELETE FROM discussion_comment_ratings
            WHERE comment_id = $1
            AND user_id = $2
        `;

        const values = [ commentId, userId ];

        await db.query( text, values );

        return true;

    }
    catch ( e ) {
        console.error( e.stack );
        return false;
    }
};

exports.createComment = async ( userId, commentToMake ) => {
    try {

        const text = `
            INSERT INTO discussion_comments (
                parent_id,
                parent_type,
                comment_text,
                user_id
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [ commentToMake.parent_id, commentToMake.parent_type, commentToMake.comment_text, userId ];

        const res = await db.query( text, values );

        return comment.ormComment( res.rows[0] );

    }
    catch( e ) { 
        console.log( e.stack );
        return false;
    }
};

exports.editComment = async ( commentId, userId, editedComment ) => {

    let defaultComment = comment.emptyComment();

    const updated = {
        ...defaultComment,
        comment_text: editedComment.comment_text,
    }; 

    // The try catch will fail even if the query is successful if no rows are returned
    try {
        const text = `UPDATE discussion_comments SET comment_text = $3, updated_date = $4 WHERE comment_id = $1 AND user_id = $2 RETURNING *`;
        const values = [ commentId, userId, updated.comment_text, new Date().toISOString() ];

        let res = await db.query( text, values );
        return comment.ormComment( res.rows[0] ); // give back the edited comment
    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }
};

exports.deleteComment = async ( commentId, userId ) => {

    // The try catch will fail even if the query is successful if no rows are returned
    try {
        const text = `DELETE FROM discussion_comments WHERE comment_id = $1 AND user_id = $2 RETURNING *`;
        const values = [ commentId, userId ];

        let res = await db.query( text, values );
        
        return comment.ormComment( res.rows[0] );
    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }
};

// Not secure, called internally ONLY, we expect auth checks to be done before this is called
exports.getCommentsForDiscussion = async ( id, type ) => {
    try {
        
        const text = `
            SELECT C.comment_id, C.comment_text, C.parent_id, C.parent_type, C.user_id, C.creation_date, C.updated_date, SUM(CASE WHEN R.rating = TRUE THEN 1 ELSE 0 END) as likes, SUM(CASE WHEN R.rating = FALSE THEN 1 ELSE 0 END) as dislikes
            FROM discussion_comments C
            LEFT JOIN discussion_comment_ratings R ON C.comment_id = R.comment_id
            WHERE C.parent_id = $1
            AND C.parent_type = $2
            GROUP BY C.comment_id, R.comment_id
            ORDER BY C.creation_date ASC
        `; 

        const values = [ id, type ];

        let res = await db.query( text, values );

        return res.rows.map( comment.ormComment );
    }
    catch( e ) {
        console.log( e.stack );
        return false;
    }
};
