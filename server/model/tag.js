class tag {
    constructor( ) {
        this.id = -1;
        this.tag = "";
        this.parent = -1;
        this.lastUsed;
        this.createTime;
        this.ownedBy = -1;
    }
}

exports.emptyTag = () => {
    return new tag();
}

exports.ormTag = (row) => {
    let tag = exports.emptyTag();
    tag.id = row.id;
    tag.tag = row.tag;
    tag.parent = row.parent;
    tag.lastUsed = row.last_used;
    tag.createTime = row.create_time;
    tag.ownedBy = row.owned_by;
    return tag;
}