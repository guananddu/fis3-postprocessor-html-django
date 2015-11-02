/**
 * django模板引擎采用'A wrapper of Django's template engine'方式（桥接原理）
 * 详见：https://www.npmjs.com/package/django
 *
 * 在启用之前请确保python环境已经ready，然后安装django:
 * # pip install -v Django==1.7
 * //or
 * # easy_install "Django==1.7"
 */

var fs = require( 'fs' );
var path = require( 'path' );

var mkdirp = require( 'mkdirp' );

var djangoEngine = require( 'django' );
var deasync = require( 'deasync' );
var _ = require( 'underscore' );

var PATH = {
    html : 'mock/html'
}

var STORE = {
    mock: [
        '//mock your template data, for #subpath\n',
        'module.exports = {\n\n\t\n',
        '}'
    ].join( '\n' )
};

/**
 * 目录结构ready
 * @param subpath
 */
function dirready ( subpath ) {

    var targetmockfile = path.join( mockhtmlpath, subpath );
    targetmockfile += '.js';
    targetmockcommonfile = path.join( mockhtmlpath, 'common.js' );

    // 检查common.js mock文件
    !fs.existsSync( targetmockcommonfile )
        && fs.writeFileSync( targetmockcommonfile,
            STORE.mock.replace( '#subpath', 'common mock data, not for existing file' ) );

    // 检查对应目录结构的mock文件
    var targetmockfiledir = path.dirname( targetmockfile );
    !fs.existsSync( targetmockfiledir )
        && mkdirp.sync( targetmockfiledir );

    createTargetMock( targetmockfile, subpath );

}

/**
 * 先保证target的dirname是存在的
 * @param targetmockfile
 * @param subpath
 * @param content 原始文件内容
 */
function createTargetMock ( targetmockfile, subpath, content ) {
    !fs.existsSync( targetmockfile )
        && fs.writeFileSync( targetmockfile,
            STORE.mock.replace( '#subpath', subpath ) );
}

/**
 * 输出最终结果
 * @param fullname
 * @param mockhtmlpath
 * @param subpath
 */
function createHtml( fullname, mockhtmlpath, subpath, content, file ) {

    var targetmockfile = path.join( mockhtmlpath, subpath );
    targetmockfile += '.js';

    // targetmockcommonfile
    // fullname => 模版文件

    // 合并mock数据
    delete require.cache[ require.resolve( targetmockcommonfile ) ];
    delete require.cache[ require.resolve( targetmockfile ) ];
    var context = _.extend( require( targetmockcommonfile ),
        require( targetmockfile ) );

    // 默认的tplroot为当前项目的上一级
    var tplroot = path.join( projectpath, '..' );

    // 需要变异步为同步
    djangoEngine.configure( {
        template_dirs: [ tplroot ]
    } );

    var done = false;
    var data;

    var temptpl = targetmockfile + '.temp';
    fs.writeFileSync( temptpl, content );

    // 使用render方法会提示找不到模板
    djangoEngine.renderFile( temptpl, context, function ( err, out ) {
        if ( err ) {
            fs.unlinkSync( temptpl );
            throw err;
        }
        data = out;
        done = true;
    } );

    deasync.loopWhile( function(){
        return !done;
    } );

    fs.unlink( temptpl );

    // data ready
    return data;

}

// /../../project
var projectpath;
// projectpath join PATH.html
var mockhtmlpath;

var targetmockcommonfile;

module.exports = function( content, file, settings ) {

    if ( !( file.extras && file.extras.django ) )
        return content;

    // 获取当前的项目路径
    var fullname = file.fullname;
    // "/page/index.html"
    var subpath = file.subpath;
    projectpath = fullname.replace( subpath, '' );
    // 创建 projectpath + mock/html结构
    mockhtmlpath = path.join( projectpath, PATH.html );
    !fs.existsSync( mockhtmlpath )
        && mkdirp.sync( mockhtmlpath );

    dirready( subpath );

    return createHtml( fullname, mockhtmlpath, subpath, content, file );

};
