/**
 * Agora - Close the loop
 * © 2021-2023 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

var express = require( 'express' );
var router = express.Router();

const bodyParser = require( 'body-parser' );
router.use( bodyParser.urlencoded( {
    extended: true
} ) );
router.use( bodyParser.json() );

//dependencies 

// controllers
const workspaceController = require( '../../controller/apis/workspaceController' );


// workspaces /api/v1/auth/workspaces
router.route( '/' )
    // get all visible workspaces
    .get( async ( req, res ) => {
        workspaceController.getAllVisibleWorkspaces( req, res );
    } )
    // save a new workspace
    .post( async ( req, res ) => {
        workspaceController.saveWorkspace( req, res );
    }
    );
//retrieve all shared workspaces with the user.
router.route( '/shared' )
    //get all shared workspaces
    .get( async ( req, res ) => {
        workspaceController.getAllSharedWorkspaces( req, res );
    } );

router.route( '/shared/:workspaceId' )
    //get a shared workspace by ID
    .get( async ( req, res ) => {
        workspaceController.getSharedWorkspaceByID( req, res );
    } );

// workspaces /api/v1/auth/workspaces
router.route( '/:workspaceId' )
    // get a visible workspace by id
    .get( async ( req, res ) => {
        workspaceController.getWorkspaceById( req, res );

    } )
    // delete a visible workspace by id
    .delete( async ( req, res ) => {
        workspaceController.deleteWorkspaceById( req, res );
    }
    );

// Topics /api/v1/auth/workspaces/topics/:workspaceId
// workspaces /api/v1/auth/workspaces/topics/:workspaceId

router.route( '/topics/:workspaceId' )
    .get( async ( req, res ) => {
        workspaceController.getAllTopicsForWorkspaceId( req, res );
    }
    );

router.route( '/topics/shared/:workspaceId' ) // In Progress.
    .get( async ( req, res ) => {
        workspaceController.getAllTopicsForSharedWorkspaceId( req, res );
    } );

// enrollment management
router.route( '/enroll/:userId/:workspaceId' )
    // enroll an eligible user in a visibile workspace
    .post( async ( req, res ) => {

    } )
    // remove a users en
    .delete( async ( req, res ) => {

    }
    );



module.exports = router;