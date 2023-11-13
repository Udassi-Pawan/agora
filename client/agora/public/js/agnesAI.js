
// Citations logic

// citation dropdown functionality
const citationsDropdown = document.getElementById( 'citations-dropdown' );

citationsDropdown.addEventListener( 'change', ( event ) => {
    const citationType = event.target.value;
    const articleInfoObj = JSON.parse( localStorage.getItem( 'last-retrieved' ) ?? 'null' );
  
    // return here if there is no article info in localstorage
    if ( !articleInfoObj ) return;
  
    // get all card text elements
    const allCitationCards = document.querySelectorAll( 'span.card-citation-text' );
    
    const allCitations = articleInfoObj.citations;
    allCitationCards.forEach( ( cardTextElement, index ) => {
        cardTextElement.textContent = formatCitationByType( allCitations[index], citationType );
    } );

} );

// Copy Button Logic

// get all the copy buttons and add the click event listener
document.querySelectorAll( 'button.card-cite-btn' ).forEach( ( copyButton ) => {
    copyButton.addEventListener( 'click', function () {
        // the x-button is nested in two divs, so parent div is three levels up
        const cardDiv = this.parentElement.parentElement.parentElement;
        const cardID = cardDiv.getAttribute( 'data-card-index' );

        copyContentText( cardID );
        
    } );
} );

// get all the copy button text and add the click event listener
document.querySelectorAll( 'button.card-cite-btn' ).forEach( ( copyButton ) => {

    console.log( "here" );
    copyButton.addEventListener( 'click', function () {

        // the x-button is nested in two divs, so parent div is three levels up
        const cardDiv = this.parentElement.parentElement.parentElement;
        //const cardID = cardDiv.getAttribute( 'data-card-index' );

        const cardText = cardDiv.querySelector( 'span.card-citation-text' );
        //const cardTextID = cardTextDiv.getAttribute( 'data-card-index' );
        //console.log( cardText );
        //console.log( cardTextID );

        copyContentText( cardText.textContent, cardDiv );
        //copyContent();
        
    } );
} );

const createToastNotification = ( text ) => {
    document.getElementById( 'toast-text' ).innerText = text;
    const thisToast = document.getElementById( 'liveToast' );
    // eslint-disable-next-line no-undef
    const toast = new bootstrap.Toast( thisToast );
    toast.show();
};

function copyContentText ( cardText, cardDiv ) {
    //let text = document.getElementById( cardTextID ).innerHTML;
    //let buttonText = document.getElementById( cardTextID );

    let buttonText = cardDiv.querySelector( 'button.card-cite-btn' );

    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText( cardText );
            console.log( 'Content copied to clipboard' );
            buttonText.innerHTML = 'Copied';
            createToastNotification( "Copied Link! Paste citation into document where needed." );
        } 
        catch ( err ) {
            console.error ( 'Failed to copy: ', err );
        }
    };
    copyContent();
}


/**
 * Formats an article object based on citation format.
 * 
 * @param {{title: string, authors: string[], publication: string, publicationDate: string}} articleObj 
 * @param {'apa' | 'mla' | 'harvard' | 'chicago'} citationFormat 
 * @returns {string} a formatted citation string for the article
 */
function formatCitationByType( articleObj, citationFormat ) {
    const {title, authors, publication, publicationDate } = articleObj;

    switch ( citationFormat ) {

    case 'apa': 
        return `${formatAuthorsByCitationType( authors, 'apa' )} ${publicationDate}. ${title}. ${publication}`;

    case 'mla': 
        return `${formatAuthorsByCitationType( authors, 'mla' )} ${title}. ${publication}, ${publicationDate}`;

    case 'harvard': 
        return `${formatAuthorsByCitationType( authors, 'harvard' )}, ${publicationDate}. ${title}. ${publication}`;

    case 'chicago': 
        return `${formatAuthorsByCitationType( authors, 'chicago' )} ${title}. ${publication}. ${publicationDate}`;

    }

}

/**
 * Formats author names based on citation format
 * 
 * @param {string[]} authors 
 * @param {'apa' | 'mla' | 'harvard' | 'chicago'} citationFormat 
 * @returns {string} a formatted string of authors name based on citation format
 */
function formatAuthorsByCitationType( authors, citationFormat ) {
    let needsEtAl = false; // flag to include et al at the end of the authors names 
    let reducedAuthors = [];

    if ( authors.length > 2 ) { // have to reduce for 3 or more
        needsEtAl = true;

        reducedAuthors = getFirstNameLastNames( [ authors[0], authors[1], authors[2] ] );
    }
    else {
        reducedAuthors = getFirstNameLastNames( authors );
    }
    
    const finalAuthorStrings = [];

    switch ( citationFormat ) {

    case 'apa':
        reducedAuthors.forEach( ( name ) => {
            const [ lastName, firstName ] = name;

            // APA is lastName, firstInitial 
            finalAuthorStrings.push( `${lastName}, ${firstName.substring( 0, 1 )}.` );
        } );
        break;
    case 'mla':
        reducedAuthors.forEach( ( name ) => {
            const [ lastName, firstName ] = name;

            // MLA is lastName, firstName
            finalAuthorStrings.push( `${lastName}, ${firstName}.` );
        } );
        break;

    case 'harvard': 
        reducedAuthors.forEach( ( name ) => {
            const [ lastName, firstName ] = name;

            // Harvard is lastName, firstInitial 
            finalAuthorStrings.push( `${lastName}, ${firstName.substring( 0, 1 )}.` );
        } );
        break;

    case 'chicago': 
        reducedAuthors.forEach( ( name ) => {
            const [ lastName, firstName ] = name;

            // Chicago is lastName, firstName
            finalAuthorStrings.push( `${lastName}, ${firstName.substring( 0, 1 )}.` );
        } );
        break;
    }

    // add et al if necessary
    if ( needsEtAl ) {
        return finalAuthorStrings.join( '; ' ) + ' et al.';
    }
    else {
        return finalAuthorStrings.join( '; ' );
    }
}

/**
 * Splits an array of author name strings to tuples of [lastName, firstName]
 * 
 * @param {string[]} authors 
 * @returns {string[][]} list of author name tuples
 */
function getFirstNameLastNames( authors ) {
    let names = [];

    authors.forEach( ( authorName ) => {
        let authorNames = authorName.split( ' ' );

        // last name is at index 1 if there is no middle inital, 2 otherwise
        let lastName = authorNames.length > 2 ? authorNames[2] : authorNames[1];
        let firstName = authorNames[0];

        names.push( [ lastName, firstName ] );
    } );

    return names;
}

// Dropdown logic
document.getElementById( 'doc-type' ).addEventListener( 'change', function () {
    var selectedValue = this.value;
    var selectedContent = document.getElementById( 'selectedContent' );
    if ( selectedValue === 'notes' || selectedValue === 'paper' ) {
        selectedContent.classList.remove( 'hidden' );
    }
    else {
        selectedContent.classList.add( 'hidden' );
    }
} );

// Popover logic
var myPopover = new bootstrap.Popover( document.getElementById( 'myPopover' ), {
    trigger: 'manual'
} );
document.getElementById( 'myPopover' ).addEventListener( 'mouseenter', function () {
    myPopover.show();
} );
document.getElementById( 'myPopover' ).addEventListener( 'mouseleave', function () {
    myPopover.hide();
} );
