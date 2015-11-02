# fis3-postprocessor-html-django
Fis3 Django Template Parser

First:

    * django模板引擎采用'A wrapper of Django's template engine'方式（桥接原理）
    * 详见：https://www.npmjs.com/package/django
    *
    * 在启用之前请确保python环境已经ready，然后安装django:
    * # pip install -v Django==1.7
    * //or
    * # easy_install "Django==1.7"

Usage:

fis-conf.js:

    var CURR_PROJECT = path.basename( path.dirname( __filename ) );

    // 需要注册django母模板的模板
    fis.media( 'local' ).match( '/tpl/{index,second}.html', {
        extras: {
            django: true
        }
    } );

    // 在local的情况下调试，才会调用django的mock数据
    fis.media( 'local' ).match( '/tpl/**.html', {
        preprocessor: function ( content, file, settings ) {
            return content
                .replace( /\[\[tplroot\]\]/ig, CURR_PROJECT );
        },
        standard: fis.plugin( 'html-django', {
            // conf
        } )
    } );

html:

    {% include '[[tplroot]]/tpl/include/com.html' %}

会在项目的根目录生成：`/mock/html/**`这样的目录结构，`**`的结构与注册的django母模板的结构会保持一致，便于模板数据的
mock。

    /tpl/index.html => /mock/html/tpl/index.html.js
    /tpl/second.html => /mock/html/tpl/second.html.js

默认的初始化内容为：

    //mock your template data, for xxx...

    module.exports = {

        

    }

按照node的写法构造数据即可被django解析。