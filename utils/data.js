

var mobApi = {
  baseUrl: "https://apicloud.mob.com/v1/postcode/",
  myKey:"2820369744a80",
  codeToQuery : function(code){//邮编查询地址
    return this.baseUrl +"query?key="+this.myKey+"&code="+code;
  },
  getAllCity : function(){//获取全国城市数据
    return this.baseUrl +"pcd?key="+this.myKey;
  },
  queryCityCode:function(){
    return this.baseUrl +"search?key=2820369744a80&pid=40&cid=4001&word=安康";
  }

}