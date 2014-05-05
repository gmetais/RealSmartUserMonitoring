module.exports = pageViewModel;

function pageViewModel(mongoose) {

    // Mongoose schema definition
    var pageViewSchema = mongoose.Schema({
        pageId: Number,
        responseStart: Number,
        responseEnd: Number,
        domInteractive: Number,
        loadEventEnd: Number,
        firstPage: Boolean,
        inBackground: Boolean,
        timeInBackground: Number,
        conversion: Boolean
    });

    // Mongoose model compilation
    var PageView = mongoose.model('PageView', pageViewSchema);

    return PageView;
}